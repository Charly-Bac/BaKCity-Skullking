import { Server } from 'socket.io';
import {
  IGame,
  ITrick,
  GamePhase,
  SpecialCardType,
  PirateName,
} from '../../game-logic/models/index';
import { determineTrickWinner } from '../../game-logic/rules/trick-resolution';
import { checkPiratePower } from '../../game-logic/actions/pirate-powers';
import { gameManager } from '../GameManager';
import { broadcastGameState } from '../socket-utils';
import { checkRoundEnd } from './roundManager';
import { generateLogId } from '../../game-logic/utils/constants';

/**
 * Resolve the current trick: determine winner, calculate bonuses, handle pirate powers.
 */
export function resolveTrick(game: IGame, io: Server): void {
  try {
  const trick = getCurrentTrick(game);
  if (!trick) return;

  game.phase = GamePhase.RESOLVING_TRICK;

  const result = determineTrickWinner(trick.plays);
  trick.winnerId = result.winnerId;
  trick.wouldBeWinnerId = result.wouldBeWinnerId;
  trick.bonuses = result.bonuses;
  trick.isDestroyed = result.isDestroyed;
  trick.isWhiteWhaled = result.isWhiteWhaled;

  // Update player tricks won
  if (result.winnerId) {
    const winner = game.players.find((p) => p.id === result.winnerId);
    if (winner) {
      winner.roundState.tricksWon++;
      winner.roundState.bonuses.push(...result.bonuses);
    }
  }

  gameManager.updateGame(game);

  // Emit trick result
  if (result.isDestroyed && !result.winnerId) {
    io.to(game.roomCode).emit('trick_destroyed', {
      trick,
      reason: 'kraken',
    });
    pushLog(game, 'Le Kraken détruit le pli !', 'trick_destroyed');
  } else {
    const winnerName = game.players.find((p) => p.id === result.winnerId)?.name || '???';
    io.to(game.roomCode).emit('trick_resolved', {
      trick,
      winnerId: result.winnerId,
      bonuses: result.bonuses,
    });
    broadcastGameState(game, io);

    if (result.isWhiteWhaled) {
      pushLog(game, `La Baleine Blanche frappe ! ${winnerName} remporte le pli`, 'trick_won', result.winnerId || undefined);
    } else {
      pushLog(game, `${winnerName} remporte le pli ${trick.number}`, 'trick_won', result.winnerId || undefined);
    }
  }

  // Check for pirate power
  if (result.winnerId) {
    const winningPlay = trick.plays.find((p) => p.playerId === result.winnerId);
    if (winningPlay) {
      const power = checkPiratePower(winningPlay);
      if (power) {
        // Harry: store for end of round, continue to next trick normally
        if (power.pirateName === PirateName.HARRY) {
          game.pendingPiratePower = power;
          gameManager.updateGame(game);
          // Fall through to normal delay
        }
        // Juanita: peek only, continue normally
        else if (power.pirateName === PirateName.JUANITA) {
          io.to(result.winnerId).emit('juanita_peek', { undealtCards: game.undealtCards });
          pushLog(game, `${game.players.find((p) => p.id === result.winnerId)?.name} utilise le pouvoir de Juanita !`, 'pirate_power', result.winnerId);
          // Fall through to normal delay
        }
        // Interactive powers: Rosie, Will, Rascal — pause game for player input
        else {
          game.phase = GamePhase.PIRATE_POWER;
          game.pendingPiratePower = power;
          gameManager.updateGame(game);
          broadcastGameState(game, io);
          handlePiratePowerPrompt(game, io, power);
          return;
        }
      }
    }
  }

  // No interactive power — proceed after animation delay
  const delay = game.isDebugMode ? 1000 : 2500;
  const timer = setTimeout(() => {
    checkRoundEnd(game, io);
  }, delay);
  gameManager.addGameTimer(game.id, timer);
  } catch (err) {
    console.error('[resolveTrick] Error:', err);
  }
}

function handlePiratePowerPrompt(game: IGame, io: Server, power: any): void {
  const { getPowerTimeout, getBotThinkingDelay } = require('../../game-logic/utils/constants');
  const { botManager } = require('../bots/BotManager');
  const timeoutMs = getPowerTimeout(game.isDebugMode);

  io.to(game.roomCode).emit('pirate_power_request', {
    type: power.type,
    pirateName: power.pirateName,
    timeoutMs,
  });

  const player = game.players.find((p) => p.id === power.playerId);

  // Will: draw cards first
  if (power.pirateName === PirateName.WILL) {
    const { resolveWillDraw } = require('../../game-logic/actions/pirate-powers');
    const drawResult = resolveWillDraw(game, power.playerId);
    if (drawResult.success) {
      power.drawnCards = drawResult.drawnCards;
      io.to(power.playerId).emit('will_draw_cards', {
        drawnCards: drawResult.drawnCards,
      });
    }
  }

  // Bot auto-resolve
  if (player?.isBot) {
    const bot = botManager.getBot(player.id);
    if (bot) {
      const delay = getBotThinkingDelay(game.isDebugMode);
      const timer = setTimeout(() => {
        autoResolvePiratePower(game, io, power, bot);
      }, delay);
      gameManager.addGameTimer(game.id, timer);
    }
  } else {
    // Human timeout: auto-resolve with default if no response
    const timer = setTimeout(() => {
      if (game.pendingPiratePower?.playerId === power.playerId) {
        autoResolveDefaultPower(game, io, power);
      }
    }, timeoutMs);
    gameManager.addGameTimer(game.id, timer);
  }
}

function autoResolveDefaultPower(game: IGame, io: Server, power: any): void {
  const { PiratePowerType } = require('../../game-logic/models/index');
  switch (power.type) {
    case PiratePowerType.ROSIE_CHOOSE_LEADER:
      finishPiratePower(game, io, { targetPlayerId: power.playerId }); // self
      break;
    case PiratePowerType.WILL_DRAW_DISCARD: {
      const player = game.players.find((p: any) => p.id === power.playerId);
      if (player && player.hand.length >= 2) {
        finishPiratePower(game, io, { discardCardIds: [player.hand[0].id, player.hand[1].id] });
      }
      break;
    }
    case PiratePowerType.RASCAL_BET:
      finishPiratePower(game, io, { betAmount: 0 });
      break;
    default:
      // Just clear and continue
      game.pendingPiratePower = undefined;
      gameManager.updateGame(game);
      checkRoundEnd(game, io);
      break;
  }
}

function autoResolvePiratePower(game: IGame, io: Server, power: any, bot: any): void {
  const { PiratePowerType } = require('../../game-logic/models/index');

  switch (power.type) {
    case PiratePowerType.ROSIE_CHOOSE_LEADER: {
      const targetId = bot.ai.chooseRosieTarget(game.players, bot.id);
      finishPiratePower(game, io, { targetPlayerId: targetId });
      break;
    }
    case PiratePowerType.WILL_DRAW_DISCARD: {
      const player = game.players.find((p: any) => p.id === bot.id);
      if (player) {
        const discards = bot.ai.chooseWillDiscards(player.hand);
        finishPiratePower(game, io, { discardCardIds: discards });
      }
      break;
    }
    case PiratePowerType.RASCAL_BET: {
      const player = game.players.find((p: any) => p.id === bot.id);
      if (player) {
        const bet = bot.ai.chooseRascalBet(player.roundState);
        finishPiratePower(game, io, { betAmount: bet });
      }
      break;
    }
  }
}

/**
 * Called when a pirate power is resolved (by human or bot).
 */
export function finishPiratePower(game: IGame, io: Server, data: any): void {
  const power = game.pendingPiratePower;
  if (!power) return;

  const playerName = game.players.find((p) => p.id === power.playerId)?.name || '???';

  switch (power.pirateName) {
    case PirateName.ROSIE: {
      const { resolveRosie } = require('../../game-logic/actions/pirate-powers');
      const result = resolveRosie(game, data.targetPlayerId);
      if (result.success) {
        pushLog(game, `${playerName} (Rosie) choisit ${game.players.find((p: any) => p.id === data.targetPlayerId)?.name} pour mener le prochain pli`, 'pirate_power', power.playerId);
        game.pendingPiratePower = undefined;
        gameManager.updateGame(game);
        io.to(game.roomCode).emit('pirate_power_resolved', { type: power.type, result: data });
        checkRoundEnd(game, io, data.targetPlayerId);
        return;
      }
      break;
    }
    case PirateName.WILL: {
      const { resolveWillDiscard } = require('../../game-logic/actions/pirate-powers');
      const result = resolveWillDiscard(game, power.playerId, data.discardCardIds);
      if (result.success) {
        pushLog(game, `${playerName} (Will) échange des cartes`, 'pirate_power', power.playerId);
      }
      break;
    }
    case PirateName.RASCAL: {
      const { resolveRascalBet } = require('../../game-logic/actions/pirate-powers');
      const result = resolveRascalBet(game, power.playerId, data.betAmount);
      if (result.success) {
        pushLog(game, `${playerName} (Rascal) parie ${data.betAmount} points`, 'pirate_power', power.playerId);
      }
      break;
    }
  }

  game.pendingPiratePower = undefined;
  gameManager.updateGame(game);
  io.to(game.roomCode).emit('pirate_power_resolved', { type: power.type, result: data });

  const delay = game.isDebugMode ? 200 : 1000;
  const timer = setTimeout(() => {
    checkRoundEnd(game, io);
  }, delay);
  gameManager.addGameTimer(game.id, timer);
}

function getCurrentTrick(game: IGame): ITrick | null {
  if (!game.currentRound) return null;
  return game.currentRound.tricks[game.currentRound.currentTrickIndex] || null;
}

function pushLog(game: IGame, message: string, type: any, playerId?: string): void {
  game.logs.push({
    id: generateLogId(type),
    type,
    message,
    round: game.roundNumber,
    trick: game.currentRound?.tricks.length,
    timestamp: Date.now(),
    playerId,
  });
  if (game.logs.length > 200) game.logs = game.logs.slice(-200);
}

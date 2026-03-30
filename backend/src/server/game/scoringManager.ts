import { Server } from 'socket.io';
import {
  IGame,
  IScoreEntry,
  IPlayerScore,
  IBonus,
  GamePhase,
  PirateName,
} from '../../game-logic/models/index';
import { calculateRoundScore } from '../../game-logic/rules/scoring';
import { gameManager } from '../GameManager';
import { checkGameEnd } from './roundManager';
import { generateLogId, getPowerTimeout, getBotThinkingDelay } from '../../game-logic/utils/constants';
import { botManager } from '../bots/BotManager';

/**
 * Calculate and apply scores for the completed round.
 */
export function endRound(game: IGame, io: Server): void {
  game.phase = GamePhase.ROUND_SCORING;

  // Check for Harry power (adjusts bid at end of round, before scoring)
  const harryPower = game.pendingPiratePower;
  if (harryPower && harryPower.pirateName === PirateName.HARRY) {
    game.phase = GamePhase.PIRATE_POWER;
    gameManager.updateGame(game);

    const timeoutMs = getPowerTimeout(game.isDebugMode);
    io.to(game.roomCode).emit('harry_adjust_request', {
      currentBid: game.players.find((p) => p.id === harryPower.playerId)?.roundState.bid ?? 0,
      timeoutMs,
    });

    // Bot auto-resolve
    const harryPlayer = game.players.find((p) => p.id === harryPower.playerId);
    if (harryPlayer?.isBot) {
      const bot = botManager.getBot(harryPlayer.id);
      if (bot) {
        const delay = getBotThinkingDelay(game.isDebugMode);
        const timer = setTimeout(() => {
          const adj = bot.ai.chooseHarryAdjust(harryPlayer.roundState);
          finishHarryAndScore(game, io, adj);
        }, delay);
        gameManager.addGameTimer(game.id, timer);
      }
    }

    // Timeout for humans
    if (!harryPlayer?.isBot && game.config.timerSeconds > 0) {
      const timer = setTimeout(() => {
        finishHarryAndScore(game, io, 0);
      }, timeoutMs);
      gameManager.addGameTimer(game.id, timer);
    }

    return;
  }

  // No Harry — score directly
  applyRoundScoring(game, io);
}

export function finishHarryAndScore(game: IGame, io: Server, adjustment: -1 | 0 | 1): void {
  const power = game.pendingPiratePower;
  if (!power || power.pirateName !== PirateName.HARRY) return;

  const { resolveHarryAdjust } = require('../../game-logic/actions/pirate-powers');
  const result = resolveHarryAdjust(game, power.playerId, adjustment);

  if (result.success) {
    const playerName = game.players.find((p) => p.id === power.playerId)?.name || '???';
    pushLog(game, `${playerName} (Harry) ajuste sa mise à ${result.newBid}`, 'pirate_power', power.playerId);
    io.to(game.roomCode).emit('pirate_power_resolved', {
      type: power.type,
      result: { adjustment, newBid: result.newBid },
    });
  }

  game.pendingPiratePower = undefined;
  gameManager.updateGame(game);

  applyRoundScoring(game, io);
}

function applyRoundScoring(game: IGame, io: Server): void {
  game.phase = GamePhase.ROUND_SCORING;

  // Collect all bonuses from all tricks
  const allBonuses: IBonus[] = [];
  if (game.currentRound) {
    for (const trick of game.currentRound.tricks) {
      allBonuses.push(...trick.bonuses);
    }
  }

  // Build hit-bid map for Loot alliance
  const playerHitBidMap = new Map<string, boolean>();
  for (const player of game.players) {
    if (!player.isGhost) {
      const bid = player.roundState.bid ?? 0;
      playerHitBidMap.set(player.id, bid === player.roundState.tricksWon);
    }
  }

  // Calculate scores
  const scores: IPlayerScore[] = [];
  for (const player of game.players) {
    if (player.isGhost) continue;

    const score = calculateRoundScore({
      player,
      roundNumber: game.roundNumber,
      mode: game.config.scoringMode,
      allBonuses,
      playerHitBidMap,
    });

    player.score = score.totalScore;
    scores.push(score);
  }

  const entry: IScoreEntry = {
    round: game.roundNumber,
    scores,
  };
  game.scores.push(entry);
  gameManager.updateGame(game);

  pushLog(game, `Scores de la manche ${game.roundNumber} calculés`, 'round_scored');

  io.to(game.roomCode).emit('round_scored', {
    scores: entry,
    roundNumber: game.roundNumber,
  });

  // Delay before next round
  const delay = game.isDebugMode ? 300 : 3000;
  const timer = setTimeout(() => {
    checkGameEnd(game, io);
  }, delay);
  gameManager.addGameTimer(game.id, timer);
}

function pushLog(game: IGame, message: string, type: any, playerId?: string): void {
  game.logs.push({
    id: generateLogId(type),
    type,
    message,
    round: game.roundNumber,
    timestamp: Date.now(),
    playerId,
  });
  if (game.logs.length > 200) game.logs = game.logs.slice(-200);
}

import { Server } from 'socket.io';
import {
  IGame,
  ITrick,
  GamePhase,
  ILogEntry,
} from '../../game-logic/models/index';
import { dealRound } from '../../game-logic/actions/deal';
import { sanitizeGameForClient } from '../../game-logic/utils/sanitize';
import { getBidTimeout, getPlayTimeout, getBotThinkingDelay, generateLogId, MAX_ROUNDS } from '../../game-logic/utils/constants';
import { gameManager } from '../GameManager';
import { botManager } from '../bots/BotManager';
import { broadcastGameState } from '../socket-utils';
import { resolveTrick } from './trickResolver';
import { endRound } from './scoringManager';

/**
 * Start a new round. Called from room.ts (start_game) and after scoring.
 */
export function startRound(game: IGame, io: Server): void {
  game.roundNumber++;
  game.phase = GamePhase.DEALING;

  // Dealer rotates
  const dealerIndex = (game.roundNumber - 1) % game.players.length;

  game.currentRound = {
    number: game.roundNumber,
    tricks: [],
    currentTrickIndex: 0,
    dealerIndex,
  };

  // Deal cards
  dealRound(game);
  game.phase = GamePhase.BIDDING;

  pushLog(game, `Manche ${game.roundNumber} — Distribution de ${game.roundNumber} carte(s)`, 'round_start');
  gameManager.updateGame(game);

  // Notify each player with their hand
  for (const player of game.players) {
    if (!player.isBot && !player.isDisconnected && !player.isGhost) {
      io.to(player.id).emit('game_started', {
        game: sanitizeGameForClient(game, player.id),
      });
      io.to(player.id).emit('cards_dealt', { hand: player.hand });
    }
  }

  const timeoutMs = getBidTimeout(game.isDebugMode, game.config.timerSeconds);
  io.to(game.roomCode).emit('round_started', {
    roundNumber: game.roundNumber,
    dealerIndex,
    cardsDealt: game.roundNumber,
  });

  io.to(game.roomCode).emit('bid_request', {
    maxBid: game.roundNumber,
    timeoutMs: game.config.timerSeconds > 0 ? timeoutMs : 0,
  });

  // Bot bids
  for (const player of game.players) {
    if (player.isBot && !player.isGhost) {
      const bot = botManager.getBot(player.id);
      if (bot) {
        const delay = botManager.getBotThinkingDelay(game.isDebugMode);
        const timer = setTimeout(() => {
          const bid = bot.ai.chooseBid(player.hand, game.roundNumber);
          handleBidInternal(game, player.id, bid, io);
        }, delay);
        gameManager.addGameTimer(game.id, timer);
      }
    }
  }

  // Auto-bid timer for human players
  if (game.config.timerSeconds > 0) {
    const timer = setTimeout(() => {
      autoBidAllPending(game, io);
    }, timeoutMs);
    gameManager.addGameTimer(game.id, timer);
  }
}

/**
 * Handle a bid (internal, used by both human and bot).
 */
export function handleBidInternal(game: IGame, playerId: string, bid: number, io: Server): void {
  if (game.phase !== GamePhase.BIDDING) return;

  const player = game.players.find((p) => p.id === playerId);
  if (!player || player.roundState.bid !== null) return;

  const { canBid } = require('../../game-logic/rules/validation');
  const validation = canBid(bid, game.roundNumber);
  if (!validation.valid) return;

  player.roundState.bid = bid;
  gameManager.updateGame(game);

  io.to(game.roomCode).emit('bid_placed', { playerId, bid });
  pushLog(game, `${player.name} mise ${bid}`, 'bid_placed', playerId);

  // Check if all bids placed
  const activePlayers = game.players.filter((p) => !p.isGhost);
  const allBidsPlaced = activePlayers.every((p) => p.roundState.bid !== null);

  if (allBidsPlaced) {
    const bids = activePlayers.map((p) => ({ playerId: p.id, bid: p.roundState.bid! }));
    io.to(game.roomCode).emit('all_bids_placed', { bids });
    pushLog(game, 'Toutes les mises sont placées !', 'all_bids_placed');
    broadcastGameState(game, io);

    // Start first trick
    startTrick(game, io);
  }
}

function autoBidAllPending(game: IGame, io: Server): void {
  if (game.phase !== GamePhase.BIDDING) return;

  for (const player of game.players) {
    if (!player.isGhost && player.roundState.bid === null) {
      handleBidInternal(game, player.id, 0, io);
    }
  }
}

/**
 * Start a new trick within the current round.
 */
export function startTrick(game: IGame, io: Server, overrideLeaderId?: string): void {
  if (!game.currentRound) return;

  game.phase = GamePhase.PLAYING_TRICK;
  const trickNumber = game.currentRound.tricks.length + 1;

  // Determine who leads
  let leadIndex: number;
  if (overrideLeaderId) {
    leadIndex = game.players.findIndex((p) => p.id === overrideLeaderId);
  } else if (game.currentRound.tricks.length === 0) {
    // First trick: player after dealer
    leadIndex = (game.currentRound.dealerIndex + 1) % game.players.length;
  } else {
    // Winner of previous trick leads
    const prevTrick = game.currentRound.tricks[game.currentRound.tricks.length - 1];
    if (prevTrick.winnerId) {
      leadIndex = game.players.findIndex((p) => p.id === prevTrick.winnerId);
    } else {
      // Trick was destroyed — would-be winner leads
      leadIndex = (game.currentRound.dealerIndex + trickNumber) % game.players.length;
    }
  }

  // Build play order starting from lead
  const activePlayers = game.players.filter((p) => !p.isGhost || game.players.length === 2);
  const playOrder: string[] = [];
  for (let i = 0; i < activePlayers.length; i++) {
    const idx = (leadIndex + i) % game.players.length;
    const p = game.players[idx];
    if (!p.isGhost || game.players.length === 2) {
      playOrder.push(p.id);
    }
  }

  const trick: ITrick = {
    number: trickNumber,
    plays: [],
    leadPlayerId: playOrder[0],
    leadSuit: null,
    winnerId: null,
    bonuses: [],
    isDestroyed: false,
    isWhiteWhaled: false,
  };

  game.currentRound.tricks.push(trick);
  game.currentRound.currentTrickIndex = game.currentRound.tricks.length - 1;
  game.playOrder = playOrder;
  game.currentPlayerIndex = 0;

  gameManager.updateGame(game);

  pushLog(game, `Pli ${trickNumber}`, 'info');
  broadcastGameState(game, io);

  // Notify whose turn it is
  promptNextPlayer(game, io);
}

/**
 * Prompt the current player to play a card.
 */
export function promptNextPlayer(game: IGame, io: Server): void {
  if (game.currentPlayerIndex >= game.playOrder.length) return;

  const playerId = game.playOrder[game.currentPlayerIndex];
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return;

  const trick = getCurrentTrick(game);
  if (!trick) return;

  const { getValidCards } = require('../../game-logic/rules/validation');
  const validCards = getValidCards(player, trick);
  const validCardIds = validCards.map((c: any) => c.id);

  const timeoutMs = getPlayTimeout(game.isDebugMode, game.config.timerSeconds);

  io.to(game.roomCode).emit('play_turn', {
    playerId,
    timeoutMs: game.config.timerSeconds > 0 ? timeoutMs : 0,
    validCardIds,
  });

  // Bot auto-play
  if (player.isBot || player.isGhost) {
    const bot = botManager.getBot(player.id);
    const delay = botManager.getBotThinkingDelay(game.isDebugMode);

    const timer = setTimeout(() => {
      if (bot) {
        const cardId = bot.ai.chooseCard(player, trick);
        handlePlayCardInternal(game, playerId, cardId, io);
      } else if (player.isGhost) {
        // Barbe Grise: play random valid card
        if (validCardIds.length > 0) {
          const randomId = validCardIds[Math.floor(Math.random() * validCardIds.length)];
          handlePlayCardInternal(game, playerId, randomId, io);
        }
      }
    }, delay);
    gameManager.addGameTimer(game.id, timer);
  } else if (game.config.timerSeconds > 0) {
    // Auto-play timer for humans
    const timer = setTimeout(() => {
      const { autoPlayCard } = require('../../game-logic/actions/play-card');
      const result = autoPlayCard(game, playerId);
      if (result.success) {
        io.to(game.roomCode).emit('card_played', {
          playerId,
          card: result.playedCard!.card,
          tigressChoice: result.playedCard?.tigressChoice,
        });
        game.currentPlayerIndex++;
        gameManager.updateGame(game);
        if (result.trickComplete) {
          resolveTrick(game, io);
        } else {
          promptNextPlayer(game, io);
        }
      }
    }, timeoutMs);
    gameManager.addGameTimer(game.id, timer);
  }
}

/**
 * Handle a card play (internal, used by both human and bot).
 */
export function handlePlayCardInternal(
  game: IGame,
  playerId: string,
  cardId: string,
  io: Server,
  tigressChoice?: any,
): void {
  try {
  if (game.phase !== GamePhase.PLAYING_TRICK) return;
  if (game.playOrder[game.currentPlayerIndex] !== playerId) return;

  const { playCard } = require('../../game-logic/actions/play-card');
  const player = game.players.find((p) => p.id === playerId);

  // If Tigress and bot, auto-choose
  if (!tigressChoice) {
    const card = player?.hand.find((c: any) => c.id === cardId);
    if (card?.kind === 'special' && card.type === 'tigress') {
      const bot = botManager.getBot(playerId);
      if (bot && player) {
        tigressChoice = bot.ai.chooseTigressMode(player, getCurrentTrick(game)!);
      } else if (player?.isGhost) {
        tigressChoice = 'escape'; // Barbe Grise always flees
      }
    }
  }

  const result = playCard(game, playerId, cardId, tigressChoice);
  if (!result.success) {
    if (result.needsTigressChoice) {
      game.pendingTigressPlayerId = playerId;
      gameManager.updateGame(game);
      io.to(playerId).emit('tigress_choice_request', {
        timeoutMs: 10000,
      });
      return;
    }
    return;
  }

  game.pendingTigressPlayerId = undefined;

  const playerObj = game.players.find((p) => p.id === playerId);
  pushLog(game, `${playerObj?.name || playerId} joue une carte`, 'card_played', playerId);

  io.to(game.roomCode).emit('card_played', {
    playerId,
    card: result.playedCard!.card,
    tigressChoice: result.playedCard?.tigressChoice,
  });

  game.currentPlayerIndex++;
  gameManager.updateGame(game);
  broadcastGameState(game, io);

  if (result.trickComplete) {
    resolveTrick(game, io);
  } else {
    promptNextPlayer(game, io);
  }
  } catch (err) {
    console.error('[handlePlayCardInternal] Error:', err);
  }
}

/**
 * After all tricks in a round are done, or called from trickResolver.
 */
export function checkRoundEnd(game: IGame, io: Server, overrideLeaderId?: string): void {
  if (!game.currentRound) return;

  const totalTricks = game.roundNumber;
  const tricksPlayed = game.currentRound.tricks.length;

  if (tricksPlayed >= totalTricks) {
    endRound(game, io);
  } else {
    startTrick(game, io, overrideLeaderId);
  }
}

/**
 * After round scoring is done, check if game should continue.
 */
export function checkGameEnd(game: IGame, io: Server): void {
  if (game.roundNumber >= MAX_ROUNDS) {
    game.phase = GamePhase.GAME_OVER;
    gameManager.updateGame(game);

    const sorted = [...game.players]
      .filter((p) => !p.isGhost)
      .sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    io.to(game.roomCode).emit('game_ended', {
      finalScores: game.scores,
      winnerId: winner.id,
      winnerName: winner.name,
    });

    pushLog(game, `${winner.name} remporte la partie !`, 'game_ended');
  } else {
    startRound(game, io);
  }
}

// --- Helpers ---

function getCurrentTrick(game: IGame): ITrick | null {
  if (!game.currentRound) return null;
  return game.currentRound.tricks[game.currentRound.currentTrickIndex] || null;
}

function pushLog(game: IGame, message: string, type: any, playerId?: string): void {
  const entry: ILogEntry = {
    id: generateLogId(type),
    type,
    message,
    round: game.roundNumber,
    trick: game.currentRound?.tricks.length,
    timestamp: Date.now(),
    playerId,
  };
  game.logs.push(entry);
  if (game.logs.length > 200) {
    game.logs = game.logs.slice(-200);
  }
}

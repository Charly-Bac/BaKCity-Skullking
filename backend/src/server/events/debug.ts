import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { GamePhase } from '../../game-logic/models/index';
import { buildDeck } from '../../game-logic/models/card-definitions';
import { startRound, handleBidInternal, handlePlayCardInternal, checkRoundEnd } from '../game/roundManager';

export function registerDebugEvents(socket: Socket, io: Server): void {
  socket.on('debug_view_all_hands', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    const hands = game.players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      cards: p.hand,
    }));
    socket.emit('debug_all_hands', { hands });
  });

  socket.on('debug_force_card', (data: { playerId: string; cardId: string }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;
    if (game.phase !== GamePhase.PLAYING_TRICK) return;

    handlePlayCardInternal(game, data.playerId, data.cardId, io);
  });

  socket.on('debug_set_hand', (data: { playerId: string; cardIds: string[] }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    const player = game.players.find((p) => p.id === data.playerId);
    if (!player) return;

    const allCards = buildDeck(game.config.withExtensions);
    player.hand = data.cardIds
      .map((id) => allCards.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);

    gameManager.updateGame(game);
    socket.emit('debug_hand_set', { playerId: data.playerId, hand: player.hand });
  });

  socket.on('debug_skip_phase', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    switch (game.phase) {
      case GamePhase.BIDDING:
        // Auto-bid 0 for everyone
        for (const player of game.players) {
          if (!player.isGhost && player.roundState.bid === null) {
            handleBidInternal(game, player.id, 0, io);
          }
        }
        break;
      case GamePhase.PLAYING_TRICK:
        // Auto-play for current player
        const currentId = game.playOrder[game.currentPlayerIndex];
        if (currentId) {
          const player = game.players.find((p) => p.id === currentId);
          if (player && player.hand.length > 0) {
            handlePlayCardInternal(game, currentId, player.hand[0].id, io);
          }
        }
        break;
      case GamePhase.ROUND_SCORING:
        // Skip to next round
        checkRoundEnd(game, io);
        break;
      default:
        break;
    }
  });

  socket.on('debug_set_round', (data: { roundNumber: number }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    const targetRound = Math.max(1, Math.min(10, data.roundNumber));
    game.roundNumber = targetRound - 1; // startRound will increment
    gameManager.clearGameTimers(game.id);
    startRound(game, io);
  });

  // Add a specific card to current player's hand
  socket.on('debug_add_card', (data: { cardId: string }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    const player = game.players.find((p) => p.id === socket.id);
    if (!player) return;

    const allCards = buildDeck(game.config.withExtensions);
    const card = allCards.find((c) => c.id === data.cardId);
    if (!card) return;

    player.hand.push(card);
    gameManager.updateGame(game);
    socket.emit('cards_dealt', { hand: player.hand });

    // Re-emit play_turn with updated validCardIds if it's this player's turn
    if (game.phase === GamePhase.PLAYING_TRICK && game.playOrder[game.currentPlayerIndex] === socket.id) {
      const { getValidCards } = require('../../game-logic/rules/validation');
      const trick = game.currentRound?.tricks[game.currentRound.currentTrickIndex];
      if (trick) {
        const validCards = getValidCards(player, trick);
        io.to(game.roomCode).emit('play_turn', {
          playerId: socket.id,
          timeoutMs: 0,
          validCardIds: validCards.map((c: any) => c.id),
        });
      }
    }
  });

  // List all possible card IDs
  socket.on('debug_list_cards', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    const allCards = buildDeck(game.config.withExtensions);
    const specialCards = allCards.filter(c => c.kind === 'special').map(c => ({
      id: c.id,
      type: c.type,
      name: c.pirateName || c.type,
    }));
    socket.emit('debug_card_list', { specialCards });
  });

  socket.on('debug_get_game_state', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || !game.isDebugMode) return;

    // Send full unsanitized state
    socket.emit('debug_game_state', {
      game: {
        ...game,
        deck: game.deck.length, // Just count, not full deck
      },
    });
  });
}

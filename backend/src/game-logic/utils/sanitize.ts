import {
  IGame,
  ISanitizedGame,
  ISanitizedPlayer,
  GamePhase,
} from '../models/index';

/**
 * Sanitize game state before sending to a specific client.
 * Hides: deck, undealtCards, other players' unrevealed hands, timeout IDs.
 * During BIDDING: hides other players' bids until all bids placed.
 */
export function sanitizeGameForClient(game: IGame, playerId: string): ISanitizedGame {
  const allBidsPlaced = game.players
    .filter((p) => !p.isGhost)
    .every((p) => p.roundState.bid !== null);

  const players: ISanitizedPlayer[] = game.players.map((p) => {
    const isMe = p.id === playerId;

    // Hide bids during bidding phase unless all bids placed
    const roundState = { ...p.roundState };
    if (game.phase === GamePhase.BIDDING && !allBidsPlaced && !isMe) {
      roundState.bid = null;
    }

    return {
      id: p.id,
      name: p.name,
      hand: isMe
        ? p.hand
        : p.hand.map(() => null), // Hide other players' cards
      cardCount: p.hand.length,
      score: p.score,
      roundState,
      isBot: p.isBot,
      isDisconnected: p.isDisconnected,
      isGhost: p.isGhost,
    };
  });

  return {
    id: game.id,
    roomCode: game.roomCode,
    config: game.config,
    players,
    phase: game.phase,
    currentRound: game.currentRound,
    roundNumber: game.roundNumber,
    currentPlayerIndex: game.currentPlayerIndex,
    playOrder: game.playOrder,
    pendingPiratePower: game.pendingPiratePower
      ? {
          type: game.pendingPiratePower.type,
          playerId: game.pendingPiratePower.playerId,
          pirateName: game.pendingPiratePower.pirateName,
        }
      : undefined,
    pendingTigressPlayerId: game.pendingTigressPlayerId,
    logs: game.logs,
    scores: game.scores,
    isDebugMode: game.isDebugMode,
    creatorId: game.creatorId,
  };
}

import { IGame, IPlayer } from '../models/index';
import { canBid } from '../rules/validation';

export interface BidResult {
  success: boolean;
  reason?: string;
  allBidsPlaced: boolean;
}

/**
 * Submit a bid for a player.
 */
export function submitBid(game: IGame, playerId: string, bid: number): BidResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found', allBidsPlaced: false };
  }

  if (player.roundState.bid !== null) {
    return { success: false, reason: 'Already bid', allBidsPlaced: false };
  }

  const validation = canBid(bid, game.roundNumber);
  if (!validation.valid) {
    return { success: false, reason: validation.reason, allBidsPlaced: false };
  }

  player.roundState.bid = bid;

  const activePlayers = game.players.filter((p) => !p.isGhost);
  const allBidsPlaced = activePlayers.every((p) => p.roundState.bid !== null);

  return { success: true, allBidsPlaced };
}

/**
 * Auto-bid 0 for a player (on timeout).
 */
export function autoBid(game: IGame, playerId: string): BidResult {
  return submitBid(game, playerId, 0);
}

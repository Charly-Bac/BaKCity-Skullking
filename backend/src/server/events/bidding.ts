import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { GamePhase } from '../../game-logic/models/index';
import { handleBidInternal } from '../game/roundManager';

export function registerBiddingEvents(socket: Socket, io: Server): void {
  socket.on('submit_bid', (data: { bid: number; hasCannonball?: boolean }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.BIDDING) {
      socket.emit('error', { message: 'Cannot bid now' });
      return;
    }

    const player = game.players.find((p) => p.id === socket.id);
    if (!player) return;

    // Cannonball option (Rascal scoring)
    if (data.hasCannonball) {
      player.roundState.hasCannonball = true;
    }

    handleBidInternal(game, socket.id, data.bid, io);
  });
}

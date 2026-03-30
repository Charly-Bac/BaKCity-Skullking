import { Server } from 'socket.io';
import { IGame } from '../game-logic/models/index';
import { sanitizeGameForClient } from '../game-logic/utils/sanitize';

/**
 * Broadcast sanitized game state to all human players in the room.
 * Called after every significant state change.
 */
export function broadcastGameState(game: IGame, io: Server): void {
  for (const player of game.players) {
    if (!player.isBot && !player.isDisconnected && !player.isGhost) {
      io.to(player.id).emit('game_state_updated', {
        game: sanitizeGameForClient(game, player.id),
      });
    }
  }
}

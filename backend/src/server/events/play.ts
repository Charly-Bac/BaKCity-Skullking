import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { GamePhase, TigressChoice } from '../../game-logic/models/index';
import { handlePlayCardInternal } from '../game/roundManager';
import { playerReadyForNextRound } from '../game/scoringManager';

export function registerPlayEvents(socket: Socket, io: Server): void {
  socket.on('play_card', (data: { cardId: string }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.PLAYING_TRICK) {
      socket.emit('error', { message: 'Cannot play now' });
      return;
    }

    handlePlayCardInternal(game, socket.id, data.cardId, io);
  });

  socket.on('tigress_choice', (data: { choice: TigressChoice }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.pendingTigressPlayerId !== socket.id) {
      socket.emit('error', { message: 'No Tigress choice pending' });
      return;
    }

    // Find the Tigress card in hand
    const player = game.players.find((p) => p.id === socket.id);
    if (!player) return;

    const tigressCard = player.hand.find(
      (c) => c.kind === 'special' && c.type === 'tigress',
    );
    if (!tigressCard) return;

    handlePlayCardInternal(game, socket.id, tigressCard.id, io, data.choice);
  });

  socket.on('ready_for_next_round', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) return;
    playerReadyForNextRound(game, socket.id, io);
  });
}

import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { GamePhase, PiratePowerType, PirateName } from '../../game-logic/models/index';
import { finishPiratePower } from '../game/trickResolver';
import { finishHarryAndScore } from '../game/scoringManager';

export function registerPiratePowerEvents(socket: Socket, io: Server): void {
  socket.on('rosie_choose_leader', (data: { targetPlayerId: string }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.PIRATE_POWER) return;
    if (game.pendingPiratePower?.playerId !== socket.id) return;
    if (game.pendingPiratePower?.type !== PiratePowerType.ROSIE_CHOOSE_LEADER) return;

    finishPiratePower(game, io, { targetPlayerId: data.targetPlayerId });
  });

  socket.on('will_discard', (data: { discardCardIds: [string, string] }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.PIRATE_POWER) return;
    if (game.pendingPiratePower?.playerId !== socket.id) return;
    if (game.pendingPiratePower?.type !== PiratePowerType.WILL_DRAW_DISCARD) return;

    finishPiratePower(game, io, { discardCardIds: data.discardCardIds });
  });

  socket.on('rascal_bet', (data: { betAmount: 0 | 10 | 20 }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.PIRATE_POWER) return;
    if (game.pendingPiratePower?.playerId !== socket.id) return;
    if (game.pendingPiratePower?.type !== PiratePowerType.RASCAL_BET) return;

    finishPiratePower(game, io, { betAmount: data.betAmount });
  });

  socket.on('harry_adjust_bid', (data: { adjustment: -1 | 0 | 1 }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) return;
    if (game.pendingPiratePower?.playerId !== socket.id) return;
    if (game.pendingPiratePower?.pirateName !== PirateName.HARRY) return;

    finishHarryAndScore(game, io, data.adjustment);
  });
}

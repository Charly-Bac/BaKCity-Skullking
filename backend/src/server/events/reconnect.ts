import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { sanitizeGameForClient } from '../../game-logic/utils/sanitize';
import { RECONNECT_TIMEOUT_MS } from '../../game-logic/utils/constants';
import { botManager } from '../bots/BotManager';

export function registerReconnectEvents(socket: Socket, io: Server): void {
  socket.on('request_game_state', (data: { roomCode: string; persistentId: string }) => {
    const result = gameManager.handleReconnect(socket.id, data.persistentId, data.roomCode);
    if (result) {
      socket.join(result.game.roomCode);
      socket.emit('game_state', {
        game: sanitizeGameForClient(result.game, socket.id),
        yourPlayerId: socket.id,
      });

      io.to(result.game.roomCode).emit('player_reconnected', {
        playerId: socket.id,
        playerName: result.player.name,
      });
    } else {
      socket.emit('error', { message: 'Could not reconnect', code: 'RECONNECT_FAILED' });
    }
  });

  socket.on('disconnect', () => {
    const result = gameManager.handleDisconnect(socket.id);
    if (!result) return;

    const { game, player } = result;

    io.to(game.roomCode).emit('player_disconnected', {
      playerId: socket.id,
      playerName: player.name,
      timeoutMs: RECONNECT_TIMEOUT_MS,
    });

    // Set 60s timer to replace with bot
    const timer = setTimeout(() => {
      if (player.isDisconnected) {
        replaceWithBot(game, player, io);
      }
    }, RECONNECT_TIMEOUT_MS);

    gameManager.setDisconnectTimer(socket.id, timer);
  });
}

function replaceWithBot(game: any, player: any, io: Server): void {
  const bot = botManager.createBot(game.id, `${player.name} (Bot)`);
  player.isBot = true;
  player.name = bot.name;
  // Keep the same player ID slot — bot takes over
  botManager.getBot(bot.id); // ensure registered

  // Re-map in botManager with the player's current ID
  // The bot AI will be used via the original player slot

  gameManager.updateGame(game);

  io.to(game.roomCode).emit('player_replaced_by_bot', {
    playerId: player.id,
    botName: bot.name,
  });
}

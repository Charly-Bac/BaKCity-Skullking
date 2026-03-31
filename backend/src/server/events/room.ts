import { Server, Socket } from 'socket.io';
import { gameManager } from '../GameManager';
import { sanitizeGameForClient } from '../../game-logic/utils/sanitize';
import { IGame, IRoomConfig, GamePhase } from '../../game-logic/models/index';
import { startRound } from '../game/roundManager';
import { botManager } from '../bots/BotManager';

export function registerRoomEvents(socket: Socket, io: Server): void {
  socket.on('create_room', (data: { playerName: string; config?: Partial<IRoomConfig> }) => {
    const { playerName, config } = data;

    if (!playerName?.trim()) {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    const game = gameManager.createGame(socket.id, playerName.trim(), config || {});
    socket.join(game.roomCode);

    socket.emit('room_created', {
      roomCode: game.roomCode,
      playerId: socket.id,
      persistentId: game.players[0].persistentId,
      game: sanitizeGameForClient(game, socket.id),
    });
  });

  socket.on('join_room', (data: { roomCode: string; playerName: string }) => {
    const { roomCode, playerName } = data;

    if (!playerName?.trim()) {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    const game = gameManager.getGameByRoomCode(roomCode);
    if (!game) {
      socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
      return;
    }

    if (game.phase !== GamePhase.LOBBY) {
      socket.emit('error', { message: 'Game already started', code: 'GAME_STARTED' });
      return;
    }

    if (game.players.length >= game.config.maxPlayers) {
      socket.emit('error', { message: 'Room is full', code: 'ROOM_FULL' });
      return;
    }

    const player = gameManager.addPlayer(game.id, socket.id, playerName.trim());
    if (!player) {
      socket.emit('error', { message: 'Could not join room' });
      return;
    }

    socket.join(game.roomCode);

    socket.emit('room_joined', {
      roomCode: game.roomCode,
      playerId: socket.id,
      persistentId: player.persistentId,
      game: sanitizeGameForClient(game, socket.id),
    });

    socket.to(game.roomCode).emit('player_joined', {
      player: { id: player.id, name: player.name, isBot: false },
    });
  });

  socket.on('leave_room', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) return;

    const result = gameManager.handleDisconnect(socket.id);
    if (!result) return;

    socket.leave(game.roomCode);
    io.to(game.roomCode).emit('player_left', {
      playerId: socket.id,
      playerName: result.player.name,
    });

    // If no human players left, remove the game
    const humanPlayers = game.players.filter((p) => !p.isBot);
    if (humanPlayers.length === 0) {
      gameManager.removeGame(game.id);
    }
  });

  socket.on('add_bots', (data: { count?: number }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }
    if (game.creatorId !== socket.id && game.phase === GamePhase.LOBBY) {
      // Allow anyone in lobby to add bots
    }

    const count = Math.min(data.count || 1, game.config.maxPlayers - game.players.length);
    const addedBots: { id: string; name: string }[] = [];

    for (let i = 0; i < count; i++) {
      const bot = botManager.createBot(game.id);
      const player = gameManager.addBot(game.id, bot.id, bot.name);
      if (player) {
        addedBots.push({ id: bot.id, name: bot.name });
      }
    }

    if (addedBots.length > 0) {
      io.to(game.roomCode).emit('bots_added', {
        bots: addedBots,
        game: sanitizeGameForClient(game, socket.id),
      });
    }
  });

  socket.on('remove_bot', (data: { botId: string }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.LOBBY) return;

    const removed = gameManager.removeBot(game.id, data.botId);
    if (removed) {
      botManager.removeBot(data.botId);
      io.to(game.roomCode).emit('bot_removed', {
        botId: data.botId,
        game: sanitizeGameForClient(game, socket.id),
      });
    }
  });

  socket.on('start_game', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game) {
      socket.emit('error', { message: 'Not in a game' });
      return;
    }

    if (game.phase !== GamePhase.LOBBY) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    const activePlayers = game.players.filter((p) => !p.isGhost);
    if (activePlayers.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players' });
      return;
    }

    // Start first round
    startRound(game, io);
  });

  socket.on('quick_start', (data: { playerName: string; botCount?: number; config?: Partial<IRoomConfig> }) => {
    const { playerName, botCount = 1, config } = data;

    if (!playerName?.trim()) {
      socket.emit('error', { message: 'Player name is required' });
      return;
    }

    // Create room
    const quickConfig: Partial<IRoomConfig> = {
      ...config,
      timerSeconds: 0, // No timer for quick play
      isDebugMode: config?.isDebugMode ?? false,
    };

    const game = gameManager.createGame(socket.id, playerName.trim(), quickConfig);
    socket.join(game.roomCode);

    // Add bots
    const numBots = Math.min(Math.max(1, botCount), 7);
    for (let i = 0; i < numBots; i++) {
      const bot = botManager.createBot(game.id);
      gameManager.addBot(game.id, bot.id, bot.name);
    }

    socket.emit('room_created', {
      roomCode: game.roomCode,
      playerId: socket.id,
      persistentId: game.players[0].persistentId,
      game: sanitizeGameForClient(game, socket.id),
    });

    // Auto-start
    startRound(game, io);
  });

  socket.on('rematch', () => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.GAME_OVER) return;

    resetGameForRematch(game);
    gameManager.updateGame(game);

    // Broadcast reset then start
    for (const player of game.players) {
      if (!player.isBot && !player.isDisconnected) {
        io.to(player.id).emit('game_started', {
          game: sanitizeGameForClient(game, player.id),
        });
      }
    }

    startRound(game, io);
  });

  socket.on('update_config', (data: { config: Partial<IRoomConfig> }) => {
    const game = gameManager.getGameByPlayerId(socket.id);
    if (!game || game.phase !== GamePhase.LOBBY) return;
    if (game.creatorId !== socket.id) return;

    Object.assign(game.config, data.config);
    game.isDebugMode = game.config.isDebugMode;
    gameManager.updateGame(game);

    io.to(game.roomCode).emit('config_updated', {
      config: game.config,
      game: sanitizeGameForClient(game, socket.id),
    });
  });
}

function resetGameForRematch(game: IGame): void {
  game.phase = GamePhase.LOBBY;
  game.roundNumber = 0;
  game.currentRound = null;
  game.currentPlayerIndex = 0;
  game.deck = [];
  game.undealtCards = [];
  game.pendingPiratePower = undefined;
  game.pendingTigressPlayerId = undefined;
  game.logs = [];
  game.scores = [];
  game.readyForNextRound = new Set();

  gameManager.clearGameTimers(game.id);

  for (const player of game.players) {
    player.hand = [];
    player.score = 0;
    player.roundState = { bid: null, tricksWon: 0, bonuses: [], hasCannonball: false };
    player.isDisconnected = false;
  }
}

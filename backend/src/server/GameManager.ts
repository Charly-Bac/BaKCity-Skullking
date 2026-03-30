import { v4 as uuidv4 } from 'uuid';
import {
  IGame,
  IPlayer,
  IRoomConfig,
  GamePhase,
  ScoringMode,
} from '../game-logic/models/index';
import { ROOM_CODE_LENGTH } from '../game-logic/utils/constants';

class GameManager {
  private games: Map<string, IGame> = new Map();
  private roomCodeMap: Map<string, string> = new Map(); // roomCode → gameId
  private playerGameMap: Map<string, string> = new Map(); // socketId → gameId
  private persistentToSocketMap: Map<string, string> = new Map(); // persistentId → socketId
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // socketId → timer
  private gameTimers: Map<string, NodeJS.Timeout[]> = new Map(); // gameId → timers

  // --- Room Code ---

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.roomCodeMap.has(code));
    return code;
  }

  // --- Game CRUD ---

  createGame(creatorSocketId: string, creatorName: string, config: Partial<IRoomConfig>): IGame {
    const gameId = uuidv4();
    const roomCode = this.generateRoomCode();
    const persistentId = uuidv4();

    const creator: IPlayer = {
      id: creatorSocketId,
      persistentId,
      name: creatorName,
      hand: [],
      score: 0,
      roundState: { bid: null, tricksWon: 0, bonuses: [], hasCannonball: false },
      isBot: false,
      isDisconnected: false,
      isGhost: false,
    };

    const fullConfig: IRoomConfig = {
      timerSeconds: config.timerSeconds ?? 30,
      scoringMode: config.scoringMode ?? ScoringMode.CLASSIC,
      withExtensions: config.withExtensions ?? true,
      maxPlayers: config.maxPlayers ?? 8,
      isDebugMode: config.isDebugMode ?? false,
    };

    const game: IGame = {
      id: gameId,
      roomCode,
      config: fullConfig,
      players: [creator],
      deck: [],
      undealtCards: [],
      phase: GamePhase.LOBBY,
      currentRound: null,
      roundNumber: 0,
      currentPlayerIndex: 0,
      playOrder: [creatorSocketId],
      logs: [],
      scores: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDebugMode: fullConfig.isDebugMode,
      creatorId: creatorSocketId,
    };

    this.games.set(gameId, game);
    this.roomCodeMap.set(roomCode, gameId);
    this.playerGameMap.set(creatorSocketId, gameId);
    this.persistentToSocketMap.set(persistentId, creatorSocketId);

    return game;
  }

  addPlayer(gameId: string, socketId: string, name: string): IPlayer | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.players.length >= game.config.maxPlayers) return null;
    if (game.phase !== GamePhase.LOBBY) return null;

    const persistentId = uuidv4();
    const player: IPlayer = {
      id: socketId,
      persistentId,
      name,
      hand: [],
      score: 0,
      roundState: { bid: null, tricksWon: 0, bonuses: [], hasCannonball: false },
      isBot: false,
      isDisconnected: false,
      isGhost: false,
    };

    game.players.push(player);
    game.playOrder.push(socketId);
    this.playerGameMap.set(socketId, gameId);
    this.persistentToSocketMap.set(persistentId, socketId);
    this.updateGame(game);

    return player;
  }

  addBot(gameId: string, botId: string, botName: string): IPlayer | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.players.length >= game.config.maxPlayers) return null;

    const player: IPlayer = {
      id: botId,
      persistentId: botId,
      name: botName,
      hand: [],
      score: 0,
      roundState: { bid: null, tricksWon: 0, bonuses: [], hasCannonball: false },
      isBot: true,
      isDisconnected: false,
      isGhost: false,
    };

    game.players.push(player);
    game.playOrder.push(botId);
    this.updateGame(game);

    return player;
  }

  removeBot(gameId: string, botId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const idx = game.players.findIndex((p) => p.id === botId && p.isBot);
    if (idx === -1) return false;

    game.players.splice(idx, 1);
    game.playOrder = game.playOrder.filter((id) => id !== botId);
    this.updateGame(game);
    return true;
  }

  // --- Queries ---

  getGame(gameId: string): IGame | undefined {
    return this.games.get(gameId);
  }

  getGameByRoomCode(roomCode: string): IGame | undefined {
    const gameId = this.roomCodeMap.get(roomCode.toUpperCase());
    return gameId ? this.games.get(gameId) : undefined;
  }

  getGameByPlayerId(socketId: string): IGame | undefined {
    const gameId = this.playerGameMap.get(socketId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  getPlayerInGame(game: IGame, socketId: string): IPlayer | undefined {
    return game.players.find((p) => p.id === socketId);
  }

  // --- Updates ---

  updateGame(game: IGame): void {
    game.updatedAt = Date.now();
    this.games.set(game.id, game);
  }

  // --- Player disconnect/reconnect ---

  handleDisconnect(socketId: string): { game: IGame; player: IPlayer } | null {
    const game = this.getGameByPlayerId(socketId);
    if (!game) return null;

    const player = game.players.find((p) => p.id === socketId);
    if (!player) return null;

    if (game.phase === GamePhase.LOBBY) {
      // Remove from lobby
      game.players = game.players.filter((p) => p.id !== socketId);
      game.playOrder = game.playOrder.filter((id) => id !== socketId);
      this.playerGameMap.delete(socketId);
      this.updateGame(game);
      return { game, player };
    }

    // Mark as disconnected during active game
    player.isDisconnected = true;
    this.updateGame(game);
    return { game, player };
  }

  handleReconnect(socketId: string, persistentId: string, roomCode: string): { game: IGame; player: IPlayer } | null {
    const game = this.getGameByRoomCode(roomCode);
    if (!game) return null;

    const player = game.players.find((p) => p.persistentId === persistentId);
    if (!player || !player.isDisconnected) return null;

    // Update socket ID mapping
    const oldSocketId = player.id;
    this.playerGameMap.delete(oldSocketId);

    player.id = socketId;
    player.isDisconnected = false;
    this.playerGameMap.set(socketId, game.id);
    this.persistentToSocketMap.set(persistentId, socketId);

    // Update play order
    game.playOrder = game.playOrder.map((id) => (id === oldSocketId ? socketId : id));

    // Clear disconnect timer
    const timer = this.disconnectTimers.get(oldSocketId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(oldSocketId);
    }

    this.updateGame(game);
    return { game, player };
  }

  setDisconnectTimer(socketId: string, timer: NodeJS.Timeout): void {
    this.disconnectTimers.set(socketId, timer);
  }

  clearDisconnectTimer(socketId: string): void {
    const timer = this.disconnectTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(socketId);
    }
  }

  // --- Game Timers ---

  addGameTimer(gameId: string, timer: NodeJS.Timeout): void {
    const timers = this.gameTimers.get(gameId) || [];
    timers.push(timer);
    this.gameTimers.set(gameId, timers);
  }

  clearGameTimers(gameId: string): void {
    const timers = this.gameTimers.get(gameId) || [];
    for (const t of timers) clearTimeout(t);
    this.gameTimers.delete(gameId);
  }

  // --- Cleanup ---

  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    this.clearGameTimers(gameId);
    this.roomCodeMap.delete(game.roomCode);

    for (const player of game.players) {
      this.playerGameMap.delete(player.id);
      this.persistentToSocketMap.delete(player.persistentId);
      this.clearDisconnectTimer(player.id);
    }

    this.games.delete(gameId);
  }

  removePlayerMapping(socketId: string): void {
    this.playerGameMap.delete(socketId);
  }
}

export const gameManager = new GameManager();

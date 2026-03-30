import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';
import type {
  ISanitizedGame,
  ICard,
  IBonus,
  ITrick,
  IScoreEntry,
  ILogEntry,
  PiratePowerType,
  PirateName,
  TigressChoice,
  IRoomConfig,
} from '../types/game';

export interface GameEventHandlers {
  onRoomCreated?: (data: { roomCode: string; playerId: string; persistentId: string; game: ISanitizedGame }) => void;
  onRoomJoined?: (data: { roomCode: string; playerId: string; persistentId: string; game: ISanitizedGame }) => void;
  onPlayerJoined?: (data: { player: { id: string; name: string; isBot: boolean } }) => void;
  onPlayerLeft?: (data: { playerId: string; playerName: string }) => void;
  onBotsAdded?: (data: { bots: { id: string; name: string }[]; game: ISanitizedGame }) => void;
  onBotRemoved?: (data: { botId: string; game: ISanitizedGame }) => void;
  onConfigUpdated?: (data: { config: IRoomConfig; game: ISanitizedGame }) => void;
  onGameStarted?: (data: { game: ISanitizedGame }) => void;
  onRoundStarted?: (data: { roundNumber: number; dealerIndex: number; cardsDealt: number }) => void;
  onCardsDealt?: (data: { hand: ICard[] }) => void;
  onBidRequest?: (data: { maxBid: number; timeoutMs: number }) => void;
  onBidPlaced?: (data: { playerId: string; bid: number }) => void;
  onAllBidsPlaced?: (data: { bids: { playerId: string; bid: number }[] }) => void;
  onPlayTurn?: (data: { playerId: string; timeoutMs: number; validCardIds: string[] }) => void;
  onCardPlayed?: (data: { playerId: string; card: ICard; tigressChoice?: TigressChoice }) => void;
  onTigressChoiceRequest?: (data: { timeoutMs: number }) => void;
  onTrickResolved?: (data: { trick: ITrick; winnerId: string | null; bonuses: IBonus[] }) => void;
  onTrickDestroyed?: (data: { trick: ITrick; reason: string }) => void;
  onPiratePowerRequest?: (data: { type: PiratePowerType; pirateName: PirateName; timeoutMs: number }) => void;
  onPiratePowerResolved?: (data: { type: PiratePowerType; result: any }) => void;
  onWillDrawCards?: (data: { drawnCards: ICard[] }) => void;
  onJuanitaPeek?: (data: { undealtCards: ICard[] }) => void;
  onHarryAdjustRequest?: (data: { currentBid: number; timeoutMs: number }) => void;
  onRoundScored?: (data: { scores: IScoreEntry; roundNumber: number }) => void;
  onGameEnded?: (data: { finalScores: IScoreEntry[]; winnerId: string; winnerName: string }) => void;
  onGameState?: (data: { game: ISanitizedGame; yourPlayerId: string }) => void;
  onGameStateUpdated?: (data: { game: ISanitizedGame }) => void;
  onPlayerDisconnected?: (data: { playerId: string; playerName: string; timeoutMs: number }) => void;
  onPlayerReconnected?: (data: { playerId: string; playerName: string }) => void;
  onPlayerReplacedByBot?: (data: { playerId: string; botName: string }) => void;
  onError?: (data: { message: string; code?: string }) => void;
}

export function useGameSocket(handlers: GameEventHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const events: [string, string][] = [
      ['room_created', 'onRoomCreated'],
      ['room_joined', 'onRoomJoined'],
      ['player_joined', 'onPlayerJoined'],
      ['player_left', 'onPlayerLeft'],
      ['bots_added', 'onBotsAdded'],
      ['bot_removed', 'onBotRemoved'],
      ['config_updated', 'onConfigUpdated'],
      ['game_started', 'onGameStarted'],
      ['round_started', 'onRoundStarted'],
      ['cards_dealt', 'onCardsDealt'],
      ['bid_request', 'onBidRequest'],
      ['bid_placed', 'onBidPlaced'],
      ['all_bids_placed', 'onAllBidsPlaced'],
      ['play_turn', 'onPlayTurn'],
      ['card_played', 'onCardPlayed'],
      ['tigress_choice_request', 'onTigressChoiceRequest'],
      ['trick_resolved', 'onTrickResolved'],
      ['trick_destroyed', 'onTrickDestroyed'],
      ['pirate_power_request', 'onPiratePowerRequest'],
      ['pirate_power_resolved', 'onPiratePowerResolved'],
      ['will_draw_cards', 'onWillDrawCards'],
      ['juanita_peek', 'onJuanitaPeek'],
      ['harry_adjust_request', 'onHarryAdjustRequest'],
      ['round_scored', 'onRoundScored'],
      ['game_ended', 'onGameEnded'],
      ['game_state', 'onGameState'],
      ['game_state_updated', 'onGameStateUpdated'],
      ['player_disconnected', 'onPlayerDisconnected'],
      ['player_reconnected', 'onPlayerReconnected'],
      ['player_replaced_by_bot', 'onPlayerReplacedByBot'],
      ['error', 'onError'],
    ];

    for (const [event, handler] of events) {
      socket.on(event, (data: any) => {
        (handlersRef.current as any)[handler]?.(data);
      });
    }

    return () => {
      for (const [event] of events) {
        socket.off(event);
      }
    };
  }, []);

  // Actions
  const createRoom = useCallback((playerName: string, config?: Partial<IRoomConfig>) => {
    socketRef.current?.emit('create_room', { playerName, config });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    socketRef.current?.emit('join_room', { roomCode, playerName });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room');
  }, []);

  const addBots = useCallback((count: number) => {
    socketRef.current?.emit('add_bots', { count });
  }, []);

  const removeBot = useCallback((botId: string) => {
    socketRef.current?.emit('remove_bot', { botId });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const quickStart = useCallback((playerName: string, botCount?: number, config?: Partial<IRoomConfig>) => {
    socketRef.current?.emit('quick_start', { playerName, botCount, config });
  }, []);

  const submitBid = useCallback((bid: number, hasCannonball?: boolean) => {
    socketRef.current?.emit('submit_bid', { bid, hasCannonball });
  }, []);

  const playCard = useCallback((cardId: string) => {
    socketRef.current?.emit('play_card', { cardId });
  }, []);

  const tigressChoice = useCallback((choice: TigressChoice) => {
    socketRef.current?.emit('tigress_choice', { choice });
  }, []);

  const rosieChooseLeader = useCallback((targetPlayerId: string) => {
    socketRef.current?.emit('rosie_choose_leader', { targetPlayerId });
  }, []);

  const willDiscard = useCallback((discardCardIds: [string, string]) => {
    socketRef.current?.emit('will_discard', { discardCardIds });
  }, []);

  const rascalBet = useCallback((betAmount: 0 | 10 | 20) => {
    socketRef.current?.emit('rascal_bet', { betAmount });
  }, []);

  const harryAdjustBid = useCallback((adjustment: -1 | 0 | 1) => {
    socketRef.current?.emit('harry_adjust_bid', { adjustment });
  }, []);

  const requestGameState = useCallback((roomCode: string, persistentId: string) => {
    socketRef.current?.emit('request_game_state', { roomCode, persistentId });
  }, []);

  const rematch = useCallback(() => {
    socketRef.current?.emit('rematch');
  }, []);

  const updateConfig = useCallback((config: Partial<IRoomConfig>) => {
    socketRef.current?.emit('update_config', { config });
  }, []);

  return {
    socket: socketRef,
    actions: {
      createRoom, joinRoom, leaveRoom, addBots, removeBot,
      startGame, quickStart, submitBid, playCard, tigressChoice,
      rosieChooseLeader, willDiscard, rascalBet, harryAdjustBid,
      requestGameState, rematch, updateConfig,
    },
  };
}

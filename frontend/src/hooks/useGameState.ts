import { useState, useCallback } from 'react';
import type {
  ISanitizedGame,
  ICard,
  IBonus,
  ITrick,
  IScoreEntry,
  PiratePowerType,
  PirateName,
  TigressChoice,
} from '../types/game';
import { GamePhase } from '../types/game';

export interface GameState {
  game: ISanitizedGame | null;
  playerId: string | null;
  persistentId: string | null;
  roomCode: string | null;
  hand: ICard[];
  validCardIds: string[];
  currentTurnPlayerId: string | null;
  bidRequest: { maxBid: number; timeoutMs: number } | null;
  tigressPending: boolean;
  piratePowerRequest: { type: PiratePowerType; pirateName: PirateName; timeoutMs: number } | null;
  harryAdjustRequest: { currentBid: number; timeoutMs: number } | null;
  trickResult: { trick: ITrick; winnerId: string | null; bonuses: IBonus[] } | null;
  roundScores: { scores: IScoreEntry; roundNumber: number } | null;
  gameEndResult: { finalScores: IScoreEntry[]; winnerId: string; winnerName: string } | null;
  willDrawnCards: ICard[] | null;
  juanitaPeekCards: ICard[] | null;
  error: string | null;
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    game: null,
    playerId: null,
    persistentId: null,
    roomCode: null,
    hand: [],
    validCardIds: [],
    currentTurnPlayerId: null,
    bidRequest: null,
    tigressPending: false,
    piratePowerRequest: null,
    harryAdjustRequest: null,
    trickResult: null,
    roundScores: null,
    gameEndResult: null,
    willDrawnCards: null,
    juanitaPeekCards: null,
    error: null,
  });

  const handlers = {
    onRoomCreated: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        game: data.game,
        playerId: data.playerId,
        persistentId: data.persistentId,
        roomCode: data.roomCode,
        error: null,
      }));
    }, []),

    onRoomJoined: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        game: data.game,
        playerId: data.playerId,
        persistentId: data.persistentId,
        roomCode: data.roomCode,
        error: null,
      }));
    }, []),

    onPlayerJoined: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        return {
          ...s,
          game: {
            ...s.game,
            players: [...s.game.players, {
              ...data.player,
              hand: [],
              cardCount: 0,
              score: 0,
              roundState: { bid: null, tricksWon: 0, bonuses: [], hasCannonball: false },
              isDisconnected: false,
              isGhost: false,
            }],
          },
        };
      });
    }, []),

    onPlayerLeft: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        return {
          ...s,
          game: {
            ...s.game,
            players: s.game.players.filter((p) => p.id !== data.playerId),
          },
        };
      });
    }, []),

    onBotsAdded: useCallback((data: any) => {
      setState((s) => ({ ...s, game: data.game }));
    }, []),

    onBotRemoved: useCallback((data: any) => {
      setState((s) => ({ ...s, game: data.game }));
    }, []),

    onConfigUpdated: useCallback((data: any) => {
      setState((s) => ({ ...s, game: data.game }));
    }, []),

    onGameStarted: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        game: data.game,
        trickResult: null,
        roundScores: null,
        gameEndResult: null,
      }));
    }, []),

    onCardsDealt: useCallback((data: any) => {
      setState((s) => ({ ...s, hand: data.hand }));
    }, []),

    onBidRequest: useCallback((data: any) => {
      setState((s) => ({ ...s, bidRequest: data }));
    }, []),

    onBidPlaced: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        // Clear bidRequest if it's our own bid
        const isMyBid = data.playerId === s.playerId;
        return {
          ...s,
          bidRequest: isMyBid ? null : s.bidRequest,
          game: {
            ...s.game,
            players: s.game.players.map((p) =>
              p.id === data.playerId
                ? { ...p, roundState: { ...p.roundState, bid: data.bid } }
                : p,
            ),
          },
        };
      });
    }, []),

    onAllBidsPlaced: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        const updatedPlayers = s.game.players.map((p) => {
          const bidInfo = data.bids.find((b: any) => b.playerId === p.id);
          return bidInfo ? { ...p, roundState: { ...p.roundState, bid: bidInfo.bid } } : p;
        });
        return {
          ...s,
          game: { ...s.game, players: updatedPlayers },
          bidRequest: null,
        };
      });
    }, []),

    onPlayTurn: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        currentTurnPlayerId: data.playerId,
        validCardIds: data.validCardIds,
        trickResult: null,
      }));
    }, []),

    onCardPlayed: useCallback((data: any) => {
      setState((s) => {
        // Remove card from hand if it's ours
        const newHand = data.playerId === s.playerId
          ? s.hand.filter((c) => c.id !== data.card.id)
          : s.hand;

        // Update game players card count
        const updatedGame = s.game ? {
          ...s.game,
          players: s.game.players.map((p) =>
            p.id === data.playerId
              ? { ...p, cardCount: Math.max(0, p.cardCount - 1) }
              : p,
          ),
        } : s.game;

        return { ...s, hand: newHand, game: updatedGame };
      });
    }, []),

    onTigressChoiceRequest: useCallback((_data: any) => {
      setState((s) => ({ ...s, tigressPending: true }));
    }, []),

    onTrickResolved: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return { ...s, trickResult: data };
        const updatedPlayers = s.game.players.map((p) => {
          if (p.id === data.winnerId) {
            return { ...p, roundState: { ...p.roundState, tricksWon: p.roundState.tricksWon + 1 } };
          }
          return p;
        });
        return {
          ...s,
          game: { ...s.game, players: updatedPlayers },
          trickResult: data,
          currentTurnPlayerId: null,
        };
      });
    }, []),

    onTrickDestroyed: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        trickResult: { trick: data.trick, winnerId: null, bonuses: [] },
        currentTurnPlayerId: null,
      }));
    }, []),

    onPiratePowerRequest: useCallback((data: any) => {
      setState((s) => ({ ...s, piratePowerRequest: data }));
    }, []),

    onPiratePowerResolved: useCallback((_data: any) => {
      setState((s) => ({ ...s, piratePowerRequest: null }));
    }, []),

    onWillDrawCards: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        hand: [...s.hand, ...data.drawnCards],
        willDrawnCards: data.drawnCards,
      }));
    }, []),

    onJuanitaPeek: useCallback((data: any) => {
      setState((s) => ({ ...s, juanitaPeekCards: data.undealtCards }));
    }, []),

    onHarryAdjustRequest: useCallback((data: any) => {
      setState((s) => ({ ...s, harryAdjustRequest: data }));
    }, []),

    onRoundScored: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return { ...s, roundScores: data };
        const updatedPlayers = s.game.players.map((p) => {
          const scoreInfo = data.scores.scores.find((sc: any) => sc.playerId === p.id);
          return scoreInfo ? { ...p, score: scoreInfo.totalScore } : p;
        });
        return {
          ...s,
          game: { ...s.game, players: updatedPlayers, scores: [...s.game.scores, data.scores] },
          roundScores: data,
          hand: [],
        };
      });
    }, []),

    onGameEnded: useCallback((data: any) => {
      setState((s) => ({ ...s, gameEndResult: data }));
    }, []),

    onGameState: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        game: data.game,
        playerId: data.yourPlayerId,
      }));
    }, []),

    onGameStateUpdated: useCallback((data: any) => {
      setState((s) => ({
        ...s,
        game: data.game,
      }));
    }, []),

    onPlayerDisconnected: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        return {
          ...s,
          game: {
            ...s.game,
            players: s.game.players.map((p) =>
              p.id === data.playerId ? { ...p, isDisconnected: true } : p,
            ),
          },
        };
      });
    }, []),

    onPlayerReconnected: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        return {
          ...s,
          game: {
            ...s.game,
            players: s.game.players.map((p) =>
              p.id === data.playerId ? { ...p, isDisconnected: false } : p,
            ),
          },
        };
      });
    }, []),

    onPlayerReplacedByBot: useCallback((data: any) => {
      setState((s) => {
        if (!s.game) return s;
        return {
          ...s,
          game: {
            ...s.game,
            players: s.game.players.map((p) =>
              p.id === data.playerId ? { ...p, isBot: true, name: data.botName } : p,
            ),
          },
        };
      });
    }, []),

    onError: useCallback((data: any) => {
      setState((s) => ({ ...s, error: data.message }));
    }, []),
  };

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const clearTrickResult = useCallback(() => {
    setState((s) => ({ ...s, trickResult: null }));
  }, []);

  const clearRoundScores = useCallback(() => {
    setState((s) => ({ ...s, roundScores: null }));
  }, []);

  const clearTigress = useCallback(() => {
    setState((s) => ({ ...s, tigressPending: false }));
  }, []);

  const clearWillDraw = useCallback(() => {
    setState((s) => ({ ...s, willDrawnCards: null }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      game: null, playerId: null, persistentId: null, roomCode: null,
      hand: [], validCardIds: [], currentTurnPlayerId: null,
      bidRequest: null, tigressPending: false, piratePowerRequest: null,
      harryAdjustRequest: null, trickResult: null, roundScores: null,
      gameEndResult: null, willDrawnCards: null, juanitaPeekCards: null, error: null,
    });
  }, []);

  return {
    state,
    handlers,
    clearError,
    clearTrickResult,
    clearRoundScores,
    clearTigress,
    clearWillDraw,
    resetState,
  };
}

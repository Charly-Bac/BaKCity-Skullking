import { createContext, useContext, type ReactNode } from 'react';
import { useGameSocket, type GameEventHandlers } from './useGameSocket';
import { useGameState } from './useGameState';
import type { IRoomConfig, TigressChoice } from '../types/game';

interface GameContextValue {
  state: ReturnType<typeof useGameState>['state'];
  actions: ReturnType<typeof useGameSocket>['actions'];
  clearError: () => void;
  clearTrickResult: () => void;
  clearRoundScores: () => void;
  clearTigress: () => void;
  clearWillDraw: () => void;
  resetState: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const {
    state,
    handlers,
    clearError,
    clearTrickResult,
    clearRoundScores,
    clearTigress,
    clearWillDraw,
    resetState,
  } = useGameState();

  const { actions } = useGameSocket(handlers);

  return (
    <GameContext.Provider value={{
      state,
      actions,
      clearError,
      clearTrickResult,
      clearRoundScores,
      clearTigress,
      clearWillDraw,
      resetState,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

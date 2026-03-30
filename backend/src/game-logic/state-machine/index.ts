import { GamePhase } from '../models/index';

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  [GamePhase.LOBBY]: [GamePhase.DEALING],
  [GamePhase.DEALING]: [GamePhase.BIDDING],
  [GamePhase.BIDDING]: [GamePhase.PLAYING_TRICK],
  [GamePhase.PLAYING_TRICK]: [GamePhase.RESOLVING_TRICK],
  [GamePhase.RESOLVING_TRICK]: [
    GamePhase.PIRATE_POWER,
    GamePhase.PLAYING_TRICK,
    GamePhase.ROUND_SCORING,
  ],
  [GamePhase.PIRATE_POWER]: [GamePhase.PLAYING_TRICK, GamePhase.ROUND_SCORING],
  [GamePhase.ROUND_SCORING]: [GamePhase.DEALING, GamePhase.GAME_OVER],
  [GamePhase.GAME_OVER]: [GamePhase.LOBBY],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionTo(currentPhase: GamePhase, targetPhase: GamePhase): GamePhase {
  if (!canTransition(currentPhase, targetPhase)) {
    throw new Error(`Invalid phase transition: ${currentPhase} → ${targetPhase}`);
  }
  return targetPhase;
}

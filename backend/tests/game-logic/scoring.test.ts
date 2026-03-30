import { describe, it, expect } from 'vitest';
import { calculateRoundScore } from '../../src/game-logic/rules/scoring';
import { createPlayer, createRoundState } from '../helpers/factories';
import { ScoringMode, BonusType, IBonus } from '../../src/game-logic/models/index';

describe('calculateRoundScore — Classic', () => {
  const mode = ScoringMode.CLASSIC;

  it('correct bid (non-zero): +20 per trick', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 3, tricksWon: 3 }) });
    const result = calculateRoundScore({
      player, roundNumber: 5, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(60);
    expect(result.roundScore).toBe(60);
  });

  it('incorrect bid: -10 per diff', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 2, tricksWon: 4 }) });
    const result = calculateRoundScore({
      player, roundNumber: 5, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(-20);
  });

  it('bid 0 correct: +10 × round number', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 0, tricksWon: 0 }) });
    const result = calculateRoundScore({
      player, roundNumber: 7, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(70);
  });

  it('bid 0 wrong: -10 × round number', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 0, tricksWon: 2 }) });
    const result = calculateRoundScore({
      player, roundNumber: 9, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(-90);
  });

  it('bonuses only counted when bid is correct', () => {
    const bonuses: IBonus[] = [
      { playerId: '', type: BonusType.CAPTURED_14_STANDARD, points: 10 },
      { playerId: '', type: BonusType.SK_CAPTURES_PIRATE, points: 30 },
    ];

    // Correct bid
    const correct = createPlayer({ id: 'p1', roundState: createRoundState({ bid: 2, tricksWon: 2 }) });
    bonuses.forEach((b) => (b.playerId = 'p1'));
    const r1 = calculateRoundScore({
      player: correct, roundNumber: 5, mode, allBonuses: bonuses, playerHitBidMap: new Map(),
    });
    expect(r1.bonusPoints).toBe(40);
    expect(r1.roundScore).toBe(80); // 40 base + 40 bonus

    // Wrong bid
    const wrong = createPlayer({ id: 'p2', roundState: createRoundState({ bid: 2, tricksWon: 3 }) });
    const wrongBonuses = bonuses.map((b) => ({ ...b, playerId: 'p2' }));
    const r2 = calculateRoundScore({
      player: wrong, roundNumber: 5, mode, allBonuses: wrongBonuses, playerHitBidMap: new Map(),
    });
    expect(r2.bonusPoints).toBe(0);
  });
});

describe('calculateRoundScore — Rascal', () => {
  const mode = ScoringMode.RASCAL;

  it('exact bid: 100% of potential', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 3, tricksWon: 3 }) });
    const result = calculateRoundScore({
      player, roundNumber: 5, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(50); // 10 × 5
  });

  it('off by 1: 50% of potential', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 3, tricksWon: 2 }) });
    const result = calculateRoundScore({
      player, roundNumber: 6, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(30); // 60 / 2
  });

  it('off by 2+: 0%', () => {
    const player = createPlayer({ roundState: createRoundState({ bid: 0, tricksWon: 3 }) });
    const result = calculateRoundScore({
      player, roundNumber: 4, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(result.basePoints).toBe(0);
  });

  it('cannonball: 15 × roundNumber if exact, 0 otherwise', () => {
    const exact = createPlayer({ roundState: createRoundState({ bid: 2, tricksWon: 2, hasCannonball: true }) });
    const r1 = calculateRoundScore({
      player: exact, roundNumber: 6, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(r1.basePoints).toBe(90); // 15 × 6

    const miss = createPlayer({ roundState: createRoundState({ bid: 2, tricksWon: 3, hasCannonball: true }) });
    const r2 = calculateRoundScore({
      player: miss, roundNumber: 6, mode, allBonuses: [], playerHitBidMap: new Map(),
    });
    expect(r2.basePoints).toBe(0);
  });

  it('bonuses scale with accuracy', () => {
    const bonus: IBonus[] = [
      { playerId: 'p1', type: BonusType.SIREN_CAPTURES_SK, points: 40 },
    ];

    // Exact: 100% bonus
    const exact = createPlayer({ id: 'p1', roundState: createRoundState({ bid: 1, tricksWon: 1 }) });
    const r1 = calculateRoundScore({
      player: exact, roundNumber: 3, mode, allBonuses: bonus, playerHitBidMap: new Map(),
    });
    expect(r1.bonusPoints).toBe(40);

    // Off by 1: 50% bonus
    const off1 = createPlayer({ id: 'p1', roundState: createRoundState({ bid: 1, tricksWon: 2 }) });
    const r2 = calculateRoundScore({
      player: off1, roundNumber: 3, mode, allBonuses: bonus, playerHitBidMap: new Map(),
    });
    expect(r2.bonusPoints).toBe(20);

    // Off by 2: 0% bonus
    const off2 = createPlayer({ id: 'p1', roundState: createRoundState({ bid: 0, tricksWon: 3 }) });
    const r3 = calculateRoundScore({
      player: off2, roundNumber: 3, mode, allBonuses: bonus, playerHitBidMap: new Map(),
    });
    expect(r3.bonusPoints).toBe(0);
  });
});

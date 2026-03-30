import { describe, it, expect, beforeEach } from 'vitest';
import { determineTrickWinner } from '../../src/game-logic/rules/trick-resolution';
import {
  createNumberedCard,
  createPirate,
  createSkullKing,
  createSiren,
  createEscape,
  createTigress,
  createKraken,
  createWhiteWhale,
  createLoot,
  createPlayedCard,
  resetIdCounter,
} from '../helpers/factories';
import { Suit, PirateName, TigressChoice, BonusType } from '../../src/game-logic/models/index';

beforeEach(() => resetIdCounter());

describe('determineTrickWinner', () => {
  describe('numbered cards only', () => {
    it('highest card of lead suit wins', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.PARROT, 5)),
        createPlayedCard('p2', createNumberedCard(Suit.PARROT, 12)),
        createPlayedCard('p3', createNumberedCard(Suit.PARROT, 8)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
      expect(result.isDestroyed).toBe(false);
    });

    it('off-suit cards cannot win even with higher value', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.TREASURE_CHEST, 12)),
        createPlayedCard('p2', createNumberedCard(Suit.TREASURE_CHEST, 5)),
        createPlayedCard('p3', createNumberedCard(Suit.TREASURE_MAP, 14)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p1');
    });

    it('trump (Jolly Roger) beats any other suit', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.TREASURE_CHEST, 12)),
        createPlayedCard('p2', createNumberedCard(Suit.TREASURE_CHEST, 5)),
        createPlayedCard('p3', createNumberedCard(Suit.JOLLY_ROGER, 2)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p3');
    });

    it('highest trump wins when multiple trumps', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 3)),
        createPlayedCard('p2', createNumberedCard(Suit.JOLLY_ROGER, 10)),
        createPlayedCard('p3', createNumberedCard(Suit.PARROT, 14)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });
  });

  describe('special cards hierarchy', () => {
    it('pirate beats all numbered cards', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 14)),
        createPlayedCard('p2', createPirate(PirateName.ROSIE)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('first pirate wins if multiple pirates', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.ROSIE)),
        createPlayedCard('p2', createPirate(PirateName.WILL)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p1');
    });

    it('Skull King beats pirates', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.ROSIE)),
        createPlayedCard('p2', createSkullKing()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('Siren beats Skull King', () => {
      const plays = [
        createPlayedCard('p1', createSkullKing()),
        createPlayedCard('p2', createSiren()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('Siren loses to pirate (no SK)', () => {
      const plays = [
        createPlayedCard('p1', createSiren()),
        createPlayedCard('p2', createPirate(PirateName.WILL)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('Siren + Pirate + SK → Siren ALWAYS wins', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.ROSIE)),
        createPlayedCard('p2', createSkullKing()),
        createPlayedCard('p3', createSiren()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p3');
    });

    it('escape always loses', () => {
      const plays = [
        createPlayedCard('p1', createEscape()),
        createPlayedCard('p2', createNumberedCard(Suit.PARROT, 1)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('all escapes → first player wins', () => {
      const plays = [
        createPlayedCard('p1', createEscape()),
        createPlayedCard('p2', createEscape()),
        createPlayedCard('p3', createEscape()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p1');
    });

    it('Tigress as pirate beats numbered cards', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 14)),
        createPlayedCard('p2', createTigress(), TigressChoice.PIRATE),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
    });

    it('Tigress as escape loses', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.PARROT, 1)),
        createPlayedCard('p2', createTigress(), TigressChoice.ESCAPE),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p1');
    });
  });

  describe('Kraken', () => {
    it('destroys the trick — no winner', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 14)),
        createPlayedCard('p2', createKraken()),
        createPlayedCard('p3', createSkullKing()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBeNull();
      expect(result.isDestroyed).toBe(true);
    });
  });

  describe('White Whale', () => {
    it('destroys specials, highest numbered value wins regardless of suit', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 2)),
        createPlayedCard('p2', createPirate(PirateName.ROSIE)),
        createPlayedCard('p3', createNumberedCard(Suit.TREASURE_CHEST, 14)),
        createPlayedCard('p4', createSkullKing()),
        createPlayedCard('p5', createWhiteWhale()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p3');
      expect(result.isWhiteWhaled).toBe(true);
    });

    it('all specials destroyed → whale player gets the trick', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.ROSIE)),
        createPlayedCard('p2', createWhiteWhale()),
        createPlayedCard('p3', createEscape()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.winnerId).toBe('p2');
      expect(result.isDestroyed).toBe(true);
    });
  });

  describe('Kraken + White Whale', () => {
    it('second played wins: Kraken first → White Whale effect applies', () => {
      const plays = [
        createPlayedCard('p1', createKraken()),
        createPlayedCard('p2', createWhiteWhale()),
        createPlayedCard('p3', createNumberedCard(Suit.PARROT, 7)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.isWhiteWhaled).toBe(true);
      expect(result.winnerId).toBe('p3');
    });

    it('second played wins: White Whale first → Kraken destroys', () => {
      const plays = [
        createPlayedCard('p1', createWhiteWhale()),
        createPlayedCard('p2', createKraken()),
        createPlayedCard('p3', createNumberedCard(Suit.PARROT, 7)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.isDestroyed).toBe(true);
      expect(result.winnerId).toBeNull();
    });
  });

  describe('bonuses', () => {
    it('SK captures pirate → +30 bonus', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.WILL)),
        createPlayedCard('p2', createSkullKing()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.bonuses).toContainEqual({
        playerId: 'p2',
        type: BonusType.SK_CAPTURES_PIRATE,
        points: 30,
      });
    });

    it('Siren captures SK → +40 bonus', () => {
      const plays = [
        createPlayedCard('p1', createSkullKing()),
        createPlayedCard('p2', createSiren()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.bonuses).toContainEqual({
        playerId: 'p2',
        type: BonusType.SIREN_CAPTURES_SK,
        points: 40,
      });
    });

    it('Pirate captures Siren → +20 bonus', () => {
      const plays = [
        createPlayedCard('p1', createSiren()),
        createPlayedCard('p2', createPirate(PirateName.ROSIE)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.bonuses).toContainEqual({
        playerId: 'p2',
        type: BonusType.PIRATE_CAPTURES_SIREN,
        points: 20,
      });
    });

    it('capturing a standard 14 → +10 bonus', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.PARROT, 14)),
        createPlayedCard('p2', createPirate(PirateName.ROSIE)),
      ];
      const result = determineTrickWinner(plays);
      expect(result.bonuses).toContainEqual({
        playerId: 'p2',
        type: BonusType.CAPTURED_14_STANDARD,
        points: 10,
      });
    });

    it('capturing black 14 → +20 bonus', () => {
      const plays = [
        createPlayedCard('p1', createNumberedCard(Suit.JOLLY_ROGER, 14)),
        createPlayedCard('p2', createSkullKing()),
      ];
      const result = determineTrickWinner(plays);
      expect(result.bonuses).toContainEqual({
        playerId: 'p2',
        type: BonusType.CAPTURED_14_BLACK,
        points: 20,
      });
    });

    it('SK captures multiple pirates → +30 per pirate', () => {
      const plays = [
        createPlayedCard('p1', createPirate(PirateName.ROSIE)),
        createPlayedCard('p2', createPirate(PirateName.WILL)),
        createPlayedCard('p3', createSkullKing()),
      ];
      const result = determineTrickWinner(plays);
      const skBonuses = result.bonuses.filter((b) => b.type === BonusType.SK_CAPTURES_PIRATE);
      expect(skBonuses.length).toBe(2);
      expect(skBonuses.reduce((s, b) => s + b.points, 0)).toBe(60);
    });
  });
});

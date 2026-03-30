import {
  IPlayedCard,
  IBonus,
  BonusType,
  Suit,
  SpecialCardType,
  TigressChoice,
  TRUMP_SUIT,
  INumberedCard,
} from '../models/index';
import { getLeadSuit } from './validation';

export interface TrickResult {
  winnerId: string | null;
  bonuses: IBonus[];
  isDestroyed: boolean;
  isWhiteWhaled: boolean;
}

function isEscapeLike(play: IPlayedCard): boolean {
  if (play.card.kind !== 'special') return false;
  return (
    play.card.type === SpecialCardType.ESCAPE ||
    play.card.type === SpecialCardType.LOOT ||
    (play.card.type === SpecialCardType.TIGRESS && play.tigressChoice === TigressChoice.ESCAPE)
  );
}

function isPirateLike(play: IPlayedCard): boolean {
  if (play.card.kind !== 'special') return false;
  return (
    play.card.type === SpecialCardType.PIRATE ||
    (play.card.type === SpecialCardType.TIGRESS && play.tigressChoice === TigressChoice.PIRATE)
  );
}

function hasType(plays: IPlayedCard[], type: SpecialCardType): boolean {
  return plays.some((p) => p.card.kind === 'special' && p.card.type === type);
}

function findFirstOfType(plays: IPlayedCard[], type: SpecialCardType): IPlayedCard | undefined {
  return plays.find((p) => p.card.kind === 'special' && p.card.type === type);
}

/**
 * Determine the winner of a trick and calculate bonuses.
 * This is the core resolution logic following the Skull King card hierarchy.
 */
export function determineTrickWinner(plays: IPlayedCard[]): TrickResult {
  if (plays.length === 0) {
    return { winnerId: null, bonuses: [], isDestroyed: false, isWhiteWhaled: false };
  }

  const bonuses: IBonus[] = [];

  // --- 1. Check for Kraken ---
  const hasKraken = hasType(plays, SpecialCardType.KRAKEN);
  const hasWhiteWhale = hasType(plays, SpecialCardType.WHITE_WHALE);

  // If both Kraken and White Whale: the SECOND one played wins the battle
  if (hasKraken && hasWhiteWhale) {
    const krakenIndex = plays.findIndex(
      (p) => p.card.kind === 'special' && p.card.type === SpecialCardType.KRAKEN,
    );
    const whaleIndex = plays.findIndex(
      (p) => p.card.kind === 'special' && p.card.type === SpecialCardType.WHITE_WHALE,
    );

    if (whaleIndex > krakenIndex) {
      // White Whale played after Kraken → White Whale effect applies
      return resolveWhiteWhale(plays, bonuses);
    } else {
      // Kraken played after White Whale → Kraken destroys everything
      return { winnerId: null, bonuses: [], isDestroyed: true, isWhiteWhaled: false };
    }
  }

  if (hasKraken) {
    return { winnerId: null, bonuses: [], isDestroyed: true, isWhiteWhaled: false };
  }

  // --- 2. Check for White Whale ---
  if (hasWhiteWhale) {
    return resolveWhiteWhale(plays, bonuses);
  }

  // --- 3. Normal resolution (no leviathans) ---
  return resolveNormal(plays, bonuses);
}

/**
 * White Whale effect: destroys all special cards, numbered cards lose their suit.
 * Highest numbered value wins regardless of original suit.
 */
function resolveWhiteWhale(plays: IPlayedCard[], bonuses: IBonus[]): TrickResult {
  const numberedPlays = plays.filter((p) => p.card.kind === 'numbered');

  // If no numbered cards remain, trick is destroyed
  if (numberedPlays.length === 0) {
    // Defaussed like Kraken — White Whale player starts next trick
    const whalePlay = findFirstOfType(plays, SpecialCardType.WHITE_WHALE);
    return {
      winnerId: whalePlay?.playerId ?? null,
      bonuses: [],
      isDestroyed: true,
      isWhiteWhaled: true,
    };
  }

  // Highest number wins (suit doesn't matter). Ties: first played wins.
  let winner = numberedPlays[0];
  for (let i = 1; i < numberedPlays.length; i++) {
    const current = numberedPlays[i].card as INumberedCard;
    const best = winner.card as INumberedCard;
    if (current.value > best.value) {
      winner = numberedPlays[i];
    }
  }

  // Calculate 14-capture bonuses for the winner
  calculate14Bonuses(plays, winner.playerId, bonuses);

  return {
    winnerId: winner.playerId,
    bonuses,
    isDestroyed: false,
    isWhiteWhaled: true,
  };
}

/**
 * Normal trick resolution following the full hierarchy:
 * Siren beats SK (always), SK beats Pirates/numbered, Pirates beat numbered, etc.
 */
function resolveNormal(plays: IPlayedCard[], bonuses: IBonus[]): TrickResult {
  const hasSK = hasType(plays, SpecialCardType.SKULL_KING);
  const hasSiren = hasType(plays, SpecialCardType.SIREN);
  const pirates = plays.filter((p) => isPirateLike(p));
  const sirens = plays.filter(
    (p) => p.card.kind === 'special' && p.card.type === SpecialCardType.SIREN,
  );

  // --- Rule: If Siren + Pirate + SK all present → Siren ALWAYS wins ---
  if (hasSiren && hasSK) {
    const firstSiren = sirens[0];

    // Siren captures SK → +40 bonus
    bonuses.push({
      playerId: firstSiren.playerId,
      type: BonusType.SIREN_CAPTURES_SK,
      points: 40,
    });

    // SK would have captured pirates if it won, but Siren overrides
    // The Siren still gets the 14-capture bonuses
    calculate14Bonuses(plays, firstSiren.playerId, bonuses);

    return { winnerId: firstSiren.playerId, bonuses, isDestroyed: false, isWhiteWhaled: false };
  }

  // --- SK present (no Siren) ---
  if (hasSK) {
    const skPlay = findFirstOfType(plays, SpecialCardType.SKULL_KING)!;

    // SK captures each pirate → +30 per pirate
    for (const pirate of pirates) {
      bonuses.push({
        playerId: skPlay.playerId,
        type: BonusType.SK_CAPTURES_PIRATE,
        points: 30,
      });
    }

    calculate14Bonuses(plays, skPlay.playerId, bonuses);
    return { winnerId: skPlay.playerId, bonuses, isDestroyed: false, isWhiteWhaled: false };
  }

  // --- Pirates present (no SK) ---
  if (pirates.length > 0) {
    // First pirate played wins
    const winningPirate = pirates[0];

    // Pirates capture sirens → +20 per siren
    for (const siren of sirens) {
      bonuses.push({
        playerId: winningPirate.playerId,
        type: BonusType.PIRATE_CAPTURES_SIREN,
        points: 20,
      });
    }

    calculate14Bonuses(plays, winningPirate.playerId, bonuses);
    return { winnerId: winningPirate.playerId, bonuses, isDestroyed: false, isWhiteWhaled: false };
  }

  // --- Sirens present (no SK, no Pirates) ---
  if (sirens.length > 0) {
    const firstSiren = sirens[0];
    calculate14Bonuses(plays, firstSiren.playerId, bonuses);
    return { winnerId: firstSiren.playerId, bonuses, isDestroyed: false, isWhiteWhaled: false };
  }

  // --- Only numbered cards (and possibly escapes/loot) ---
  const numberedPlays = plays.filter((p) => p.card.kind === 'numbered');

  if (numberedPlays.length === 0) {
    // All escapes/loot → first card played wins
    return { winnerId: plays[0].playerId, bonuses: [], isDestroyed: false, isWhiteWhaled: false };
  }

  const leadSuit = getLeadSuit(plays);
  const winner = resolveNumberedCards(numberedPlays, leadSuit);

  if (winner) {
    calculate14Bonuses(plays, winner.playerId, bonuses);
    return { winnerId: winner.playerId, bonuses, isDestroyed: false, isWhiteWhaled: false };
  }

  // Fallback: first player
  return { winnerId: plays[0].playerId, bonuses: [], isDestroyed: false, isWhiteWhaled: false };
}

/**
 * Resolve numbered cards: trump beats everything, then highest of lead suit wins.
 */
function resolveNumberedCards(
  numberedPlays: IPlayedCard[],
  leadSuit: Suit | null,
): IPlayedCard | null {
  if (numberedPlays.length === 0) return null;

  // Check for trump cards
  const trumpPlays = numberedPlays.filter(
    (p) => (p.card as INumberedCard).suit === TRUMP_SUIT,
  );

  if (trumpPlays.length > 0) {
    // Highest trump wins
    return trumpPlays.reduce((best, current) =>
      (current.card as INumberedCard).value > (best.card as INumberedCard).value ? current : best,
    );
  }

  // No trumps: highest card of lead suit wins
  if (leadSuit) {
    const leadSuitPlays = numberedPlays.filter(
      (p) => (p.card as INumberedCard).suit === leadSuit,
    );
    if (leadSuitPlays.length > 0) {
      return leadSuitPlays.reduce((best, current) =>
        (current.card as INumberedCard).value > (best.card as INumberedCard).value ? current : best,
      );
    }
  }

  // No lead suit matched (shouldn't normally happen): highest value
  return numberedPlays.reduce((best, current) =>
    (current.card as INumberedCard).value > (best.card as INumberedCard).value ? current : best,
  );
}

/**
 * Calculate bonus points for captured 14-value cards.
 */
function calculate14Bonuses(
  plays: IPlayedCard[],
  winnerId: string,
  bonuses: IBonus[],
): void {
  for (const play of plays) {
    if (play.card.kind === 'numbered' && play.card.value === 14) {
      if (play.card.suit === TRUMP_SUIT) {
        bonuses.push({ playerId: winnerId, type: BonusType.CAPTURED_14_BLACK, points: 20 });
      } else {
        bonuses.push({ playerId: winnerId, type: BonusType.CAPTURED_14_STANDARD, points: 10 });
      }
    }
  }
}

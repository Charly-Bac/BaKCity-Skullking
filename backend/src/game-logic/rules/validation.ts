import {
  ICard,
  IPlayer,
  ITrick,
  IPlayedCard,
  Suit,
  SpecialCardType,
  TigressChoice,
  TRUMP_SUIT,
} from '../models/index';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Determine the effective lead suit of a trick.
 * Special cards don't set a lead suit. If the first card is an Escape/Loot/Tigress-as-escape,
 * the lead suit is determined by the next numbered card played.
 */
export function getLeadSuit(plays: IPlayedCard[]): Suit | null {
  for (const play of plays) {
    if (play.card.kind === 'numbered') {
      return play.card.suit;
    }
    // Special cards that act like "pass the lead": Escape, Loot, Tigress-as-escape
    if (play.card.kind === 'special') {
      const isPassCard =
        play.card.type === SpecialCardType.ESCAPE ||
        play.card.type === SpecialCardType.LOOT ||
        (play.card.type === SpecialCardType.TIGRESS && play.tigressChoice === TigressChoice.ESCAPE);
      if (!isPassCard) {
        // Character card leads = no suit to follow
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if a player can play a specific card given the current trick state.
 */
export function canPlayCard(
  player: IPlayer,
  card: ICard,
  trick: ITrick,
): ValidationResult {
  // Card must be in hand
  if (!player.hand.some((c) => c.id === card.id)) {
    return { valid: false, reason: 'Card not in hand' };
  }

  // Special cards can always be played (no suit following required)
  if (card.kind === 'special') {
    return { valid: true };
  }

  // Numbered card: must follow suit if applicable
  const leadSuit = getLeadSuit(trick.plays);
  if (leadSuit === null) {
    // No suit to follow (first play, or only specials before us)
    return { valid: true };
  }

  // If lead suit is set, must follow if we have that suit
  const hasLeadSuit = player.hand.some(
    (c) => c.kind === 'numbered' && c.suit === leadSuit,
  );

  if (hasLeadSuit && card.suit !== leadSuit) {
    return { valid: false, reason: `Must follow suit: ${leadSuit}` };
  }

  return { valid: true };
}

/**
 * Return all valid cards a player can play.
 */
export function getValidCards(player: IPlayer, trick: ITrick): ICard[] {
  return player.hand.filter((card) => canPlayCard(player, card, trick).valid);
}

/**
 * Validate a bid value.
 */
export function canBid(bid: number, roundNumber: number): ValidationResult {
  if (!Number.isInteger(bid)) {
    return { valid: false, reason: 'Bid must be an integer' };
  }
  if (bid < 0) {
    return { valid: false, reason: 'Bid cannot be negative' };
  }
  if (bid > roundNumber) {
    return { valid: false, reason: `Bid cannot exceed ${roundNumber}` };
  }
  return { valid: true };
}

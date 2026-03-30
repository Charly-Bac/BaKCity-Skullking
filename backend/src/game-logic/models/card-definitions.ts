import {
  ICard,
  INumberedCard,
  ISpecialCard,
  Suit,
  SpecialCardType,
  PirateName,
} from './index';

function numberedCard(suit: Suit, value: number): INumberedCard {
  return { kind: 'numbered', id: `${suit}-${value}`, suit, value };
}

function specialCard(type: SpecialCardType, index: number, pirateName?: PirateName): ISpecialCard {
  const id = pirateName ? `pirate-${pirateName}` : `${type}-${index}`;
  return { kind: 'special', id, type, pirateName };
}

export function buildDeck(withExtensions: boolean): ICard[] {
  const cards: ICard[] = [];

  // 4 suits × 14 values = 56 numbered cards
  for (const suit of Object.values(Suit)) {
    for (let value = 1; value <= 14; value++) {
      cards.push(numberedCard(suit, value));
    }
  }

  // 5 Escape cards
  for (let i = 1; i <= 5; i++) {
    cards.push(specialCard(SpecialCardType.ESCAPE, i));
  }

  // 5 named Pirates
  const pirateNames = [PirateName.ROSIE, PirateName.WILL, PirateName.RASCAL, PirateName.JUANITA, PirateName.HARRY];
  for (const name of pirateNames) {
    cards.push(specialCard(SpecialCardType.PIRATE, 0, name));
  }

  // 1 Tigress
  cards.push(specialCard(SpecialCardType.TIGRESS, 1));

  // 1 Skull King
  cards.push(specialCard(SpecialCardType.SKULL_KING, 1));

  // 2 Sirens
  for (let i = 1; i <= 2; i++) {
    cards.push(specialCard(SpecialCardType.SIREN, i));
  }

  // Extensions
  if (withExtensions) {
    cards.push(specialCard(SpecialCardType.KRAKEN, 1));
    cards.push(specialCard(SpecialCardType.WHITE_WHALE, 1));
    for (let i = 1; i <= 2; i++) {
      cards.push(specialCard(SpecialCardType.LOOT, i));
    }
  }

  return cards;
}

export function shuffleDeck(cards: ICard[]): ICard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Base deck: 66 cards (without extensions), 70 with extensions
export const BASE_CARD_COUNT = 66;
export const EXTENSION_CARD_COUNT = 4;

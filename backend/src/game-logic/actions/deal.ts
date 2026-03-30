import { IGame, IPlayerRoundState, GamePhase } from '../models/index';
import { buildDeck, shuffleDeck } from '../models/card-definitions';

/**
 * Deal cards for a new round.
 * Each player gets `roundNumber` cards.
 */
export function dealRound(game: IGame): void {
  const deck = shuffleDeck(buildDeck(game.config.withExtensions));
  const cardsPerPlayer = getCardsPerPlayer(game.roundNumber, game.players.length);

  // Reset player round state
  for (const player of game.players) {
    player.hand = [];
    player.roundState = createFreshRoundState();
  }

  // Deal cards
  const activePlayers = game.players.filter((p) => !p.isGhost || game.players.length === 2);
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (const player of activePlayers) {
      const card = deck.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  }

  // Ghost player (Barbe Grise) for 2-player mode gets cards too
  const ghost = game.players.find((p) => p.isGhost);
  if (ghost) {
    for (let i = 0; i < cardsPerPlayer; i++) {
      const card = deck.pop();
      if (card) {
        ghost.hand.push(card);
      }
    }
  }

  game.deck = deck;
  game.undealtCards = [...deck]; // For Juanita's peek power
}

/**
 * Get how many cards to deal per player.
 * For 7-8 players, rounds 9-10 may deal fewer cards.
 */
export function getCardsPerPlayer(roundNumber: number, playerCount: number): number {
  if (playerCount <= 6) return roundNumber;

  // 70 cards total (with extensions), 66 without
  // At 8 players, round 10: 80 cards needed but only 66-70 available
  // Adjust: deal floor(totalCards / playerCount) if needed
  const totalCards = 70; // max with extensions
  const needed = roundNumber * playerCount;
  if (needed > totalCards) {
    return Math.floor(totalCards / playerCount);
  }
  return roundNumber;
}

function createFreshRoundState(): IPlayerRoundState {
  return {
    bid: null,
    tricksWon: 0,
    bonuses: [],
    hasCannonball: false,
  };
}

import {
  ICard,
  IPlayer,
  ITrick,
  IPlayerRoundState,
  INumberedCard,
  Suit,
  SpecialCardType,
  TigressChoice,
  PirateName,
  TRUMP_SUIT,
} from '../../game-logic/models/index';
import { getValidCards } from '../../game-logic/rules/validation';

export class BotAI {
  /**
   * Choose a bid based on hand strength.
   */
  chooseBid(hand: ICard[], roundNumber: number): number {
    let likelyWins = 0;

    for (const card of hand) {
      if (card.kind === 'special') {
        if (card.type === SpecialCardType.SKULL_KING) likelyWins++;
        else if (card.type === SpecialCardType.PIRATE) likelyWins++;
        else if (card.type === SpecialCardType.SIREN) likelyWins += 0.7;
        else if (card.type === SpecialCardType.TIGRESS) likelyWins += 0.3;
        // Escapes, Kraken, Whale, Loot → no wins
      } else {
        // Numbered card
        if (card.suit === TRUMP_SUIT && card.value >= 8) likelyWins++;
        else if (card.suit === TRUMP_SUIT && card.value >= 4) likelyWins += 0.5;
        else if (card.value >= 12) likelyWins += 0.4;
        else if (card.value >= 10) likelyWins += 0.2;
      }
    }

    // Add slight randomness
    const bid = Math.round(likelyWins + (Math.random() * 0.6 - 0.3));
    return Math.max(0, Math.min(roundNumber, bid));
  }

  /**
   * Choose which card to play.
   */
  chooseCard(player: IPlayer, trick: ITrick): string {
    const valid = getValidCards(player, trick);
    if (valid.length === 0) return player.hand[0]?.id || '';
    if (valid.length === 1) return valid[0].id;

    const { bid, tricksWon } = player.roundState;
    const targetBid = bid ?? 0;
    const needMoreWins = tricksWon < targetBid;
    const shouldLose = tricksWon >= targetBid;

    if (shouldLose) {
      return this.pickWeakest(valid).id;
    }

    if (needMoreWins) {
      return this.pickStrongest(valid, trick).id;
    }

    return this.pickWeakest(valid).id;
  }

  chooseTigressMode(player: IPlayer, _trick: ITrick): TigressChoice {
    const { bid, tricksWon } = player.roundState;
    return (tricksWon < (bid ?? 0)) ? TigressChoice.PIRATE : TigressChoice.ESCAPE;
  }

  chooseRosieTarget(players: IPlayer[], botId: string): string {
    // Pick self if needing more wins, otherwise pick random opponent
    const self = players.find((p) => p.id === botId);
    if (self && self.roundState.tricksWon < (self.roundState.bid ?? 0)) {
      return botId;
    }
    const others = players.filter((p) => p.id !== botId && !p.isGhost);
    return others[Math.floor(Math.random() * others.length)]?.id || botId;
  }

  chooseWillDiscards(hand: ICard[]): [string, string] {
    const sorted = this.sortByStrength(hand);
    // Discard the two weakest
    return [sorted[0].id, sorted[1]?.id || sorted[0].id];
  }

  chooseRascalBet(roundState: IPlayerRoundState): 0 | 10 | 20 {
    const diff = Math.abs((roundState.bid ?? 0) - roundState.tricksWon);
    if (diff === 0) return 20; // looking good
    if (diff === 1) return 10;
    return 0;
  }

  chooseHarryAdjust(roundState: IPlayerRoundState): -1 | 0 | 1 {
    const bid = roundState.bid ?? 0;
    const tricks = roundState.tricksWon;
    if (tricks > bid) return 1;
    if (tricks < bid) return -1;
    return 0;
  }

  // --- Helpers ---

  private pickWeakest(cards: ICard[]): ICard {
    const sorted = this.sortByStrength(cards);
    return sorted[0]; // weakest first
  }

  private pickStrongest(cards: ICard[], _trick: ITrick): ICard {
    const sorted = this.sortByStrength(cards);
    return sorted[sorted.length - 1]; // strongest last
  }

  private sortByStrength(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => this.cardStrength(a) - this.cardStrength(b));
  }

  private cardStrength(card: ICard): number {
    if (card.kind === 'special') {
      switch (card.type) {
        case SpecialCardType.ESCAPE: return 0;
        case SpecialCardType.LOOT: return 1;
        case SpecialCardType.TIGRESS: return 50;
        case SpecialCardType.SIREN: return 80;
        case SpecialCardType.PIRATE: return 90;
        case SpecialCardType.SKULL_KING: return 95;
        case SpecialCardType.KRAKEN: return 5;
        case SpecialCardType.WHITE_WHALE: return 5;
        default: return 0;
      }
    }

    // Numbered: base value + trump bonus
    const base = card.value;
    if (card.suit === TRUMP_SUIT) return base + 20;
    return base;
  }
}

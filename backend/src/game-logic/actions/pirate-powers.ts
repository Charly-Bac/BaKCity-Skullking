import {
  IGame,
  ICard,
  PirateName,
  PiratePowerType,
  IPendingPiratePower,
  SpecialCardType,
  IPlayedCard,
} from '../models/index';

/**
 * Check if a winning pirate card has a power that needs activation.
 * Returns the pending power if applicable, null otherwise.
 */
export function checkPiratePower(
  winningPlay: IPlayedCard,
): IPendingPiratePower | null {
  if (winningPlay.card.kind !== 'special') return null;
  if (winningPlay.card.type !== SpecialCardType.PIRATE) return null;

  const pirateName = winningPlay.card.pirateName;
  if (!pirateName) return null;

  const powerMap: Record<PirateName, PiratePowerType> = {
    [PirateName.ROSIE]: PiratePowerType.ROSIE_CHOOSE_LEADER,
    [PirateName.WILL]: PiratePowerType.WILL_DRAW_DISCARD,
    [PirateName.RASCAL]: PiratePowerType.RASCAL_BET,
    [PirateName.JUANITA]: PiratePowerType.JUANITA_PEEK,
    [PirateName.HARRY]: PiratePowerType.HARRY_ADJUST_BID,
  };

  return {
    type: powerMap[pirateName],
    playerId: winningPlay.playerId,
    pirateName,
  };
}

// --- Rosie: Choose who starts next trick ---

export interface RosieResult {
  success: boolean;
  nextLeaderId: string;
  reason?: string;
}

export function resolveRosie(
  game: IGame,
  targetPlayerId: string,
): RosieResult {
  const target = game.players.find((p) => p.id === targetPlayerId && !p.isGhost);
  if (!target) {
    return { success: false, nextLeaderId: '', reason: 'Invalid target player' };
  }
  return { success: true, nextLeaderId: targetPlayerId };
}

// --- Will: Draw 2 from deck, then discard 2 ---

export interface WillDrawResult {
  success: boolean;
  drawnCards: ICard[];
  reason?: string;
}

export function resolveWillDraw(game: IGame, playerId: string): WillDrawResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, drawnCards: [], reason: 'Player not found' };
  }

  const drawn: ICard[] = [];
  for (let i = 0; i < 2; i++) {
    const card = game.deck.pop();
    if (card) {
      drawn.push(card);
      player.hand.push(card);
    }
  }

  return { success: true, drawnCards: drawn };
}

export interface WillDiscardResult {
  success: boolean;
  reason?: string;
}

export function resolveWillDiscard(
  game: IGame,
  playerId: string,
  discardCardIds: [string, string],
): WillDiscardResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found' };
  }

  // Validate both cards exist in hand
  for (const cardId of discardCardIds) {
    if (!player.hand.some((c) => c.id === cardId)) {
      return { success: false, reason: `Card ${cardId} not in hand` };
    }
  }

  // Remove the discarded cards
  player.hand = player.hand.filter((c) => !discardCardIds.includes(c.id));

  return { success: true };
}

// --- Rascal: Bet 0, 10, or 20 points ---

export interface RascalBetResult {
  success: boolean;
  reason?: string;
}

export function resolveRascalBet(
  game: IGame,
  playerId: string,
  betAmount: 0 | 10 | 20,
): RascalBetResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found' };
  }

  if (![0, 10, 20].includes(betAmount)) {
    return { success: false, reason: 'Invalid bet amount' };
  }

  player.roundState.rascalBetAmount = betAmount;
  return { success: true };
}

// --- Juanita: Peek at undealt cards ---

export interface JuanitaPeekResult {
  success: boolean;
  undealtCards: ICard[];
  reason?: string;
}

export function resolveJuanitaPeek(game: IGame): JuanitaPeekResult {
  return { success: true, undealtCards: [...game.undealtCards] };
}

// --- Harry: Adjust bid by -1, 0, or +1 (at end of round) ---

export interface HarryAdjustResult {
  success: boolean;
  newBid: number;
  reason?: string;
}

export function resolveHarryAdjust(
  game: IGame,
  playerId: string,
  adjustment: -1 | 0 | 1,
): HarryAdjustResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, newBid: 0, reason: 'Player not found' };
  }

  if (![-1, 0, 1].includes(adjustment)) {
    return { success: false, newBid: 0, reason: 'Invalid adjustment' };
  }

  const currentBid = player.roundState.bid ?? 0;
  const newBid = Math.max(0, currentBid + adjustment);
  player.roundState.bid = newBid;

  return { success: true, newBid };
}

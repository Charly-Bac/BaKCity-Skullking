import {
  IGame,
  ICard,
  ITrick,
  IPlayedCard,
  SpecialCardType,
  TigressChoice,
} from '../models/index';
import { canPlayCard, getLeadSuit } from '../rules/validation';

export interface PlayCardResult {
  success: boolean;
  reason?: string;
  needsTigressChoice: boolean;
  trickComplete: boolean;
  playedCard?: IPlayedCard;
}

/**
 * Play a card from a player's hand into the current trick.
 */
export function playCard(
  game: IGame,
  playerId: string,
  cardId: string,
  tigressChoice?: TigressChoice,
): PlayCardResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found', needsTigressChoice: false, trickComplete: false };
  }

  const card = player.hand.find((c) => c.id === cardId);
  if (!card) {
    return { success: false, reason: 'Card not in hand', needsTigressChoice: false, trickComplete: false };
  }

  const trick = getCurrentTrick(game);
  if (!trick) {
    return { success: false, reason: 'No current trick', needsTigressChoice: false, trickComplete: false };
  }

  // Prevent playing twice in the same trick
  if (trick.plays.some((p) => p.playerId === playerId)) {
    return { success: false, reason: 'Already played in this trick', needsTigressChoice: false, trickComplete: false };
  }

  // Validate the play
  const validation = canPlayCard(player, card, trick);
  if (!validation.valid) {
    return { success: false, reason: validation.reason, needsTigressChoice: false, trickComplete: false };
  }

  // Tigress requires a choice
  if (card.kind === 'special' && card.type === SpecialCardType.TIGRESS && !tigressChoice) {
    return { success: true, needsTigressChoice: true, trickComplete: false };
  }

  // Remove card from hand
  player.hand = player.hand.filter((c) => c.id !== cardId);

  // Add to trick
  const playedCard: IPlayedCard = {
    playerId,
    card,
    tigressChoice,
    timestamp: Date.now(),
  };
  trick.plays.push(playedCard);

  // Update lead suit if this is the first numbered card (or first determining card)
  if (trick.plays.length === 1 || trick.leadSuit === null) {
    trick.leadSuit = getLeadSuit(trick.plays);
  }

  // Check if trick is complete (all active players have played)
  const activePlayers = game.players.filter((p) => !p.isGhost || game.players.length === 2);
  const trickComplete = trick.plays.length >= activePlayers.length;

  return { success: true, needsTigressChoice: false, trickComplete, playedCard };
}

/**
 * Auto-play the first valid card for a player (on timeout).
 */
export function autoPlayCard(game: IGame, playerId: string): PlayCardResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found', needsTigressChoice: false, trickComplete: false };
  }

  const trick = getCurrentTrick(game);
  if (!trick) {
    return { success: false, reason: 'No current trick', needsTigressChoice: false, trickComplete: false };
  }

  // Find first valid card
  const validCards = player.hand.filter((c) => canPlayCard(player, c, trick).valid);
  if (validCards.length === 0) {
    return { success: false, reason: 'No valid cards', needsTigressChoice: false, trickComplete: false };
  }

  const card = validCards[0];
  // If Tigress, auto-choose escape
  const tigressChoice =
    card.kind === 'special' && card.type === SpecialCardType.TIGRESS
      ? TigressChoice.ESCAPE
      : undefined;

  return playCard(game, playerId, card.id, tigressChoice);
}

function getCurrentTrick(game: IGame): ITrick | null {
  if (!game.currentRound) return null;
  return game.currentRound.tricks[game.currentRound.currentTrickIndex] || null;
}

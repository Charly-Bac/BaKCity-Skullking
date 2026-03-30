import {
  IPlayer,
  IBonus,
  BonusType,
  ScoringMode,
  IPlayerScore,
} from '../models/index';

export interface ScoringInput {
  player: IPlayer;
  roundNumber: number;
  mode: ScoringMode;
  allBonuses: IBonus[];
  playerHitBidMap: Map<string, boolean>;
}

/**
 * Calculate a player's score for a single round.
 */
export function calculateRoundScore(input: ScoringInput): IPlayerScore {
  const { player, roundNumber, mode, allBonuses, playerHitBidMap } = input;
  const bid = player.roundState.bid ?? 0;
  const tricksWon = player.roundState.tricksWon;
  const diff = Math.abs(bid - tricksWon);
  const hitBid = diff === 0;

  // Collect this player's bonuses from tricks
  const playerBonuses = allBonuses.filter((b) => b.playerId === player.id);

  // Loot alliance bonuses: only count if both parties hit their bid
  const lootBonuses = playerBonuses.filter((b) => b.type === BonusType.LOOT_ALLIANCE);
  const nonLootBonuses = playerBonuses.filter((b) => b.type !== BonusType.LOOT_ALLIANCE);

  if (mode === ScoringMode.CLASSIC) {
    return calculateClassic(player, bid, tricksWon, diff, hitBid, roundNumber, nonLootBonuses, lootBonuses, playerHitBidMap);
  } else {
    return calculateRascal(player, bid, tricksWon, diff, hitBid, roundNumber, nonLootBonuses, lootBonuses, playerHitBidMap);
  }
}

function calculateClassic(
  player: IPlayer,
  bid: number,
  tricksWon: number,
  diff: number,
  hitBid: boolean,
  roundNumber: number,
  nonLootBonuses: IBonus[],
  lootBonuses: IBonus[],
  playerHitBidMap: Map<string, boolean>,
): IPlayerScore {
  let basePoints: number;
  let bonusPoints = 0;

  if (hitBid) {
    if (bid === 0) {
      // Bid 0 correct: +10 × round number
      basePoints = 10 * roundNumber;
    } else {
      // Bid N correct: +20 × N
      basePoints = 20 * bid;
    }

    // Bonuses only apply if bid is correct
    bonusPoints = nonLootBonuses.reduce((sum, b) => sum + b.points, 0);

    // Rascal bet bonus (from Rascal pirate power)
    if (player.roundState.rascalBetAmount) {
      bonusPoints += player.roundState.rascalBetAmount;
    }

    // Loot alliance: only if both players hit bid
    for (const lb of lootBonuses) {
      // The loot bonus is always valid if this player hit bid
      // (the alliance partner is checked separately)
      bonusPoints += lb.points;
    }
  } else {
    if (bid === 0) {
      // Bid 0 wrong: -10 × round number
      basePoints = -10 * roundNumber;
    } else {
      // Bid wrong: -10 × diff
      basePoints = -10 * diff;
    }

    // Rascal bet: lose the bet amount if bid missed
    if (player.roundState.rascalBetAmount) {
      bonusPoints -= player.roundState.rascalBetAmount;
    }
  }

  const roundScore = basePoints + bonusPoints;

  return {
    playerId: player.id,
    bid,
    tricksWon,
    basePoints,
    bonusPoints,
    roundScore,
    totalScore: player.score + roundScore,
  };
}

function calculateRascal(
  player: IPlayer,
  bid: number,
  tricksWon: number,
  diff: number,
  hitBid: boolean,
  roundNumber: number,
  nonLootBonuses: IBonus[],
  lootBonuses: IBonus[],
  playerHitBidMap: Map<string, boolean>,
): IPlayerScore {
  const potential = 10 * roundNumber;
  const hasCannonball = player.roundState.hasCannonball;

  let basePoints: number;
  let bonusMultiplier: number;

  if (hasCannonball) {
    // Cannonball: 15 × roundNumber if exact, 0 otherwise
    basePoints = hitBid ? 15 * roundNumber : 0;
    bonusMultiplier = hitBid ? 1 : 0;
  } else {
    if (diff === 0) {
      // Exact: 100%
      basePoints = potential;
      bonusMultiplier = 1;
    } else if (diff === 1) {
      // Off by 1: 50%
      basePoints = Math.floor(potential / 2);
      bonusMultiplier = 0.5;
    } else {
      // Off by 2+: 0%
      basePoints = 0;
      bonusMultiplier = 0;
    }
  }

  // Bonuses scale with multiplier
  const rawBonusPoints = nonLootBonuses.reduce((sum, b) => sum + b.points, 0);
  let bonusPoints = Math.floor(rawBonusPoints * bonusMultiplier);

  // Loot alliance
  for (const lb of lootBonuses) {
    bonusPoints += Math.floor(lb.points * bonusMultiplier);
  }

  // Rascal pirate bet
  if (player.roundState.rascalBetAmount) {
    if (hitBid) {
      bonusPoints += player.roundState.rascalBetAmount;
    } else if (diff === 1 && !hasCannonball) {
      bonusPoints += Math.floor(player.roundState.rascalBetAmount / 2);
    }
    // diff >= 2 or cannonball miss: lose nothing extra in Rascal mode (just 0 bonus)
  }

  const roundScore = basePoints + bonusPoints;

  return {
    playerId: player.id,
    bid,
    tricksWon,
    basePoints,
    bonusPoints,
    roundScore,
    totalScore: player.score + roundScore,
  };
}

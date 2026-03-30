// ============================================================
// Canonical types — source of truth for the entire project
// ============================================================

// --- Card Enums ---

export enum Suit {
  PARROT = 'parrot',
  TREASURE_MAP = 'treasure_map',
  TREASURE_CHEST = 'treasure_chest',
  JOLLY_ROGER = 'jolly_roger',
}

export const TRUMP_SUIT = Suit.JOLLY_ROGER;

export const STANDARD_SUITS = [Suit.PARROT, Suit.TREASURE_MAP, Suit.TREASURE_CHEST] as const;

export enum SpecialCardType {
  ESCAPE = 'escape',
  PIRATE = 'pirate',
  TIGRESS = 'tigress',
  SKULL_KING = 'skull_king',
  SIREN = 'siren',
  KRAKEN = 'kraken',
  WHITE_WHALE = 'white_whale',
  LOOT = 'loot',
}

export enum PirateName {
  ROSIE = 'rosie',
  WILL = 'will',
  RASCAL = 'rascal',
  JUANITA = 'juanita',
  HARRY = 'harry',
}

export enum TigressChoice {
  PIRATE = 'pirate',
  ESCAPE = 'escape',
}

// --- Card Interfaces ---

export interface INumberedCard {
  kind: 'numbered';
  id: string;
  suit: Suit;
  value: number; // 1-14
}

export interface ISpecialCard {
  kind: 'special';
  id: string;
  type: SpecialCardType;
  pirateName?: PirateName;
}

export type ICard = INumberedCard | ISpecialCard;

// --- Game Phase ---

export enum GamePhase {
  LOBBY = 'lobby',
  DEALING = 'dealing',
  BIDDING = 'bidding',
  PLAYING_TRICK = 'playing_trick',
  RESOLVING_TRICK = 'resolving_trick',
  PIRATE_POWER = 'pirate_power',
  ROUND_SCORING = 'round_scoring',
  GAME_OVER = 'game_over',
}

// --- Scoring ---

export enum ScoringMode {
  CLASSIC = 'classic',
  RASCAL = 'rascal',
}

export enum BonusType {
  CAPTURED_14_STANDARD = 'captured_14_standard',
  CAPTURED_14_BLACK = 'captured_14_black',
  PIRATE_CAPTURES_SIREN = 'pirate_captures_siren',
  SK_CAPTURES_PIRATE = 'sk_captures_pirate',
  SIREN_CAPTURES_SK = 'siren_captures_sk',
  LOOT_ALLIANCE = 'loot_alliance',
  RASCAL_BET = 'rascal_bet',
}

export interface IBonus {
  playerId: string;
  type: BonusType;
  points: number;
}

// --- Pirate Powers ---

export enum PiratePowerType {
  ROSIE_CHOOSE_LEADER = 'rosie_choose_leader',
  WILL_DRAW_DISCARD = 'will_draw_discard',
  RASCAL_BET = 'rascal_bet',
  JUANITA_PEEK = 'juanita_peek',
  HARRY_ADJUST_BID = 'harry_adjust_bid',
}

// --- Trick ---

export interface IPlayedCard {
  playerId: string;
  card: ICard;
  tigressChoice?: TigressChoice;
  timestamp: number;
}

export interface ITrick {
  number: number;
  plays: IPlayedCard[];
  leadPlayerId: string;
  leadSuit: Suit | null;
  winnerId: string | null;
  bonuses: IBonus[];
  isDestroyed: boolean;
  isWhiteWhaled: boolean;
}

// --- Player ---

export interface IPlayerRoundState {
  bid: number | null;
  tricksWon: number;
  bonuses: IBonus[];
  hasCannonball: boolean;
  rascalBetAmount?: number;
}

export interface IPlayer {
  id: string;
  persistentId: string;
  name: string;
  hand: ICard[];
  score: number;
  roundState: IPlayerRoundState;
  isBot: boolean;
  isDisconnected: boolean;
  isGhost: boolean;
}

// --- Room Config ---

export interface IRoomConfig {
  timerSeconds: 0 | 15 | 30 | 45 | 60;
  scoringMode: ScoringMode;
  withExtensions: boolean;
  maxPlayers: number;
  isDebugMode: boolean;
}

// --- Round ---

export interface IRound {
  number: number;
  tricks: ITrick[];
  currentTrickIndex: number;
  dealerIndex: number;
}

// --- Score Entry ---

export interface IPlayerScore {
  playerId: string;
  bid: number;
  tricksWon: number;
  basePoints: number;
  bonusPoints: number;
  roundScore: number;
  totalScore: number;
}

export interface IScoreEntry {
  round: number;
  scores: IPlayerScore[];
}

// --- Pirate Power Pending ---

export interface IPendingPiratePower {
  type: PiratePowerType;
  playerId: string;
  pirateName: PirateName;
  drawnCards?: ICard[];
}

// --- Logs ---

export type LogEntryType =
  | 'round_start' | 'deal' | 'bid_placed' | 'all_bids_placed'
  | 'card_played' | 'trick_won' | 'trick_destroyed'
  | 'pirate_power' | 'round_scored' | 'game_ended'
  | 'player_joined' | 'player_left' | 'player_reconnected'
  | 'bot_replaced' | 'info' | 'debug';

export interface ILogEntry {
  id: string;
  type: LogEntryType;
  message: string;
  round: number;
  trick?: number;
  timestamp: number;
  playerId?: string;
}

// --- Game ---

export interface IGame {
  id: string;
  roomCode: string;
  config: IRoomConfig;
  players: IPlayer[];
  deck: ICard[];
  undealtCards: ICard[];
  phase: GamePhase;
  currentRound: IRound | null;
  roundNumber: number;
  currentPlayerIndex: number;
  playOrder: string[];
  pendingPiratePower?: IPendingPiratePower;
  pendingTigressPlayerId?: string;
  logs: ILogEntry[];
  scores: IScoreEntry[];
  createdAt: number;
  updatedAt: number;
  isDebugMode: boolean;
  creatorId: string;
}

// --- Sanitized Game (sent to clients) ---

export interface ISanitizedPlayer {
  id: string;
  name: string;
  hand: (ICard | null)[];
  cardCount: number;
  score: number;
  roundState: IPlayerRoundState;
  isBot: boolean;
  isDisconnected: boolean;
  isGhost: boolean;
}

export interface ISanitizedGame {
  id: string;
  roomCode: string;
  config: IRoomConfig;
  players: ISanitizedPlayer[];
  phase: GamePhase;
  currentRound: IRound | null;
  roundNumber: number;
  currentPlayerIndex: number;
  playOrder: string[];
  pendingPiratePower?: { type: PiratePowerType; playerId: string; pirateName: PirateName };
  pendingTigressPlayerId?: string;
  logs: ILogEntry[];
  scores: IScoreEntry[];
  isDebugMode: boolean;
  creatorId: string;
}

// ============================================================
// Duplicated types from backend — keep in sync!
// ============================================================

export enum Suit {
  PARROT = 'parrot',
  TREASURE_MAP = 'treasure_map',
  TREASURE_CHEST = 'treasure_chest',
  JOLLY_ROGER = 'jolly_roger',
}

export const TRUMP_SUIT = Suit.JOLLY_ROGER;

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

export interface INumberedCard {
  kind: 'numbered';
  id: string;
  suit: Suit;
  value: number;
}

export interface ISpecialCard {
  kind: 'special';
  id: string;
  type: SpecialCardType;
  pirateName?: PirateName;
}

export type ICard = INumberedCard | ISpecialCard;

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

export enum PiratePowerType {
  ROSIE_CHOOSE_LEADER = 'rosie_choose_leader',
  WILL_DRAW_DISCARD = 'will_draw_discard',
  RASCAL_BET = 'rascal_bet',
  JUANITA_PEEK = 'juanita_peek',
  HARRY_ADJUST_BID = 'harry_adjust_bid',
}

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

export interface IPlayerRoundState {
  bid: number | null;
  tricksWon: number;
  bonuses: IBonus[];
  hasCannonball: boolean;
  rascalBetAmount?: number;
}

export interface IRoomConfig {
  timerSeconds: 0 | 15 | 30 | 45 | 60;
  scoringMode: ScoringMode;
  withExtensions: boolean;
  maxPlayers: number;
  isDebugMode: boolean;
}

export interface IRound {
  number: number;
  tricks: ITrick[];
  currentTrickIndex: number;
  dealerIndex: number;
}

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

// --- Socket.IO Event Payloads ---

export interface RoomCreatedEvent {
  roomCode: string;
  playerId: string;
  game: ISanitizedGame;
}

export interface RoomJoinedEvent {
  roomCode: string;
  playerId: string;
  game: ISanitizedGame;
}

export interface GameStartedEvent {
  game: ISanitizedGame;
}

export interface CardsDealtEvent {
  hand: ICard[];
}

export interface BidRequestEvent {
  maxBid: number;
  timeoutMs: number;
}

export interface BidPlacedEvent {
  playerId: string;
  bid: number;
}

export interface PlayTurnEvent {
  playerId: string;
  timeoutMs: number;
  validCardIds: string[];
}

export interface CardPlayedEvent {
  playerId: string;
  card: ICard;
  tigressChoice?: TigressChoice;
}

export interface TrickResolvedEvent {
  trick: ITrick;
  winnerId: string | null;
  bonuses: IBonus[];
}

export interface RoundScoredEvent {
  scores: IScoreEntry;
  roundNumber: number;
}

export interface GameEndedEvent {
  finalScores: IScoreEntry[];
  winnerId: string;
  winnerName: string;
}

export interface PiratePowerRequestEvent {
  type: PiratePowerType;
  pirateName: PirateName;
  data?: unknown;
  timeoutMs: number;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

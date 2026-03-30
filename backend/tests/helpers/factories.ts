import {
  ICard,
  INumberedCard,
  ISpecialCard,
  IPlayer,
  IGame,
  IPlayerRoundState,
  ITrick,
  IPlayedCard,
  IRound,
  Suit,
  SpecialCardType,
  PirateName,
  GamePhase,
  ScoringMode,
  TigressChoice,
} from '../../src/game-logic/models/index';

let idCounter = 0;

export function resetIdCounter(): void {
  idCounter = 0;
}

export function createNumberedCard(suit: Suit = Suit.PARROT, value: number = 5): INumberedCard {
  return { kind: 'numbered', id: `${suit}-${value}`, suit, value };
}

export function createSpecialCard(
  type: SpecialCardType = SpecialCardType.PIRATE,
  pirateName?: PirateName,
): ISpecialCard {
  const id = pirateName ? `pirate-${pirateName}` : `${type}-${++idCounter}`;
  return { kind: 'special', id, type, pirateName };
}

export function createEscape(): ISpecialCard {
  return createSpecialCard(SpecialCardType.ESCAPE);
}

export function createPirate(name: PirateName = PirateName.ROSIE): ISpecialCard {
  return createSpecialCard(SpecialCardType.PIRATE, name);
}

export function createSkullKing(): ISpecialCard {
  return createSpecialCard(SpecialCardType.SKULL_KING);
}

export function createSiren(): ISpecialCard {
  return createSpecialCard(SpecialCardType.SIREN);
}

export function createTigress(): ISpecialCard {
  return createSpecialCard(SpecialCardType.TIGRESS);
}

export function createKraken(): ISpecialCard {
  return createSpecialCard(SpecialCardType.KRAKEN);
}

export function createWhiteWhale(): ISpecialCard {
  return createSpecialCard(SpecialCardType.WHITE_WHALE);
}

export function createLoot(): ISpecialCard {
  return createSpecialCard(SpecialCardType.LOOT);
}

export function createRoundState(overrides?: Partial<IPlayerRoundState>): IPlayerRoundState {
  return {
    bid: null,
    tricksWon: 0,
    bonuses: [],
    hasCannonball: false,
    ...overrides,
  };
}

export function createPlayer(overrides?: Partial<IPlayer>): IPlayer {
  const id = `player-${++idCounter}`;
  return {
    id,
    persistentId: id,
    name: `Player ${idCounter}`,
    hand: [],
    score: 0,
    roundState: createRoundState(),
    isBot: false,
    isDisconnected: false,
    isGhost: false,
    ...overrides,
  };
}

export function createTrick(overrides?: Partial<ITrick>): ITrick {
  return {
    number: 1,
    plays: [],
    leadPlayerId: '',
    leadSuit: null,
    winnerId: null,
    bonuses: [],
    isDestroyed: false,
    isWhiteWhaled: false,
    ...overrides,
  };
}

export function createPlayedCard(
  playerId: string,
  card: ICard,
  tigressChoice?: TigressChoice,
): IPlayedCard {
  return {
    playerId,
    card,
    tigressChoice,
    timestamp: Date.now(),
  };
}

export function createRound(overrides?: Partial<IRound>): IRound {
  return {
    number: 1,
    tricks: [],
    currentTrickIndex: 0,
    dealerIndex: 0,
    ...overrides,
  };
}

export function createGame(players?: IPlayer[], overrides?: Partial<IGame>): IGame {
  const ps = players || [createPlayer(), createPlayer()];
  return {
    id: `game-${++idCounter}`,
    roomCode: 'TEST1',
    config: {
      timerSeconds: 30,
      scoringMode: ScoringMode.CLASSIC,
      withExtensions: true,
      maxPlayers: 8,
      isDebugMode: false,
    },
    players: ps,
    deck: [],
    undealtCards: [],
    phase: GamePhase.LOBBY,
    currentRound: null,
    roundNumber: 0,
    currentPlayerIndex: 0,
    playOrder: ps.map((p) => p.id),
    logs: [],
    scores: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDebugMode: false,
    creatorId: ps[0]?.id || '',
    ...overrides,
  };
}

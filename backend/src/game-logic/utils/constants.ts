// --- Timer Constants ---

export const BID_TIMEOUT_MS = 30000;
export const PLAY_TIMEOUT_MS = 30000;
export const PIRATE_POWER_TIMEOUT_MS = 20000;
export const TIGRESS_TIMEOUT_MS = 10000;
export const HARRY_TIMEOUT_MS = 15000;
export const TRICK_DISPLAY_MS = 2000;
export const ROUND_SCORE_DISPLAY_MS = 5000;

// Debug timers
export const DEBUG_BID_TIMEOUT_MS = 3000;
export const DEBUG_PLAY_TIMEOUT_MS = 3000;
export const DEBUG_POWER_TIMEOUT_MS = 2000;
export const DEBUG_TRICK_DISPLAY_MS = 500;

// Bot timing
export const BOT_THINKING_MIN_MS = 2000;
export const BOT_THINKING_MAX_MS = 5000;
export const DEBUG_BOT_THINKING_MS = 500;

// --- Game Constants ---

export const MAX_ROUNDS = 10;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const STARTING_COINS = 0; // Skull King has no coins
export const RECONNECT_TIMEOUT_MS = 60000;
export const MAX_LOG_ENTRIES = 200;
export const ROOM_CODE_LENGTH = 5;

// --- Helpers ---

export function getTimerMs(baseMs: number, debugMs: number, isDebug?: boolean, configTimer?: number): number {
  if (isDebug) return debugMs;
  if (configTimer && configTimer > 0) return configTimer * 1000;
  return baseMs;
}

export function getBidTimeout(isDebug?: boolean, configTimer?: number): number {
  return getTimerMs(BID_TIMEOUT_MS, DEBUG_BID_TIMEOUT_MS, isDebug, configTimer);
}

export function getPlayTimeout(isDebug?: boolean, configTimer?: number): number {
  return getTimerMs(PLAY_TIMEOUT_MS, DEBUG_PLAY_TIMEOUT_MS, isDebug, configTimer);
}

export function getPowerTimeout(isDebug?: boolean): number {
  return isDebug ? DEBUG_POWER_TIMEOUT_MS : PIRATE_POWER_TIMEOUT_MS;
}

export function getBotThinkingDelay(isDebug?: boolean): number {
  if (isDebug) return DEBUG_BOT_THINKING_MS;
  return BOT_THINKING_MIN_MS + Math.random() * (BOT_THINKING_MAX_MS - BOT_THINKING_MIN_MS);
}

export function generateLogId(type: string): string {
  return `log-${Date.now()}-${Math.floor(Math.random() * 1000)}-${type}`;
}

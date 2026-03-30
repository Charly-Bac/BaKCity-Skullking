import { v4 as uuidv4 } from 'uuid';
import { BotAI } from './BotAI';

const BOT_NAMES = [
  'Barbe Noire', 'Capitaine Crochet', 'Jack Sparrow', 'Anne Bonny',
  'Davy Jones', 'Calico Jack', 'Barbe Rouge', 'Mary Read',
  'Long John Silver', 'Morgan', 'Drake', 'Kidd',
];

export interface BotPlayer {
  id: string;
  name: string;
  ai: BotAI;
  gameId: string;
}

class BotManagerClass {
  private bots: Map<string, BotPlayer> = new Map();
  private usedNames: Map<string, Set<string>> = new Map(); // gameId → used names

  createBot(gameId: string, name?: string): BotPlayer {
    const id = `bot-${uuidv4().slice(0, 8)}`;
    const botName = name || this.getUniqueName(gameId);
    const bot: BotPlayer = {
      id,
      name: botName,
      ai: new BotAI(),
      gameId,
    };
    this.bots.set(id, bot);
    return bot;
  }

  isBot(playerId: string): boolean {
    return playerId.startsWith('bot-') || this.bots.has(playerId);
  }

  getBot(botId: string): BotPlayer | undefined {
    return this.bots.get(botId);
  }

  removeBot(botId: string): void {
    this.bots.delete(botId);
  }

  getBotThinkingDelay(isDebug?: boolean): number {
    if (isDebug) return 300;
    return 800 + Math.random() * 1200; // 0.8-2s for faster testing
  }

  private getUniqueName(gameId: string): string {
    if (!this.usedNames.has(gameId)) {
      this.usedNames.set(gameId, new Set());
    }
    const used = this.usedNames.get(gameId)!;
    const available = BOT_NAMES.filter((n) => !used.has(n));
    const name = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : `Bot ${used.size + 1}`;
    used.add(name);
    return name;
  }
}

export const botManager = new BotManagerClass();

import { episodeCountFor } from '@/data/catalog';

export const WALLET_STORAGE_KEY = 'dramaflash.option-a.v1';
export const WALLET_SCHEMA_VERSION = 1;
export const EPISODE_COST = 10;
export const FREE_EPISODE_LIMIT = 3;
export const STARTING_BALANCE = 15;

// Demo amounts from the approved prototype. The prices are labels only.
export const coinPacks = [
  { id: 'coins-300', coins: 300, bonus: 0, priceLabel: '€2.99', badge: null },
  { id: 'coins-800', coins: 800, bonus: 50, priceLabel: '€6.99', badge: 'Popular' },
  { id: 'coins-2500', coins: 2500, bonus: 200, priceLabel: '€19.99', badge: null },
  { id: 'coins-6000', coins: 6000, bonus: 1000, priceLabel: '€49.99', badge: 'Best value' },
] as const;

export type CoinPackId = (typeof coinPacks)[number]['id'];

export type EpisodeUnlock = {
  seriesId: string;
  episode: number;
};

export type Wallet = {
  balance: number;
  unlocks: EpisodeUnlock[];
};

export type KeyValueStore = {
  getItem: (key: string) => string | null;
};

export type WalletStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export type WalletLoadResult = { status: 'ready'; wallet: Wallet } | { status: 'corrupt' };

export type UnlockDecision =
  | { type: 'unlocked'; wallet: Wallet }
  | { type: 'already-open'; wallet: Wallet }
  | { type: 'insufficient'; wallet: Wallet }
  | { type: 'rejected' };

export function freshWallet(): Wallet {
  return { balance: STARTING_BALANCE, unlocks: [] };
}

export function isEpisodeInSeries(episodeCount: number | null, episode: number): boolean {
  return (
    episodeCount !== null && Number.isInteger(episode) && episode >= 1 && episode <= episodeCount
  );
}

export function isEpisodeUnlocked(wallet: Wallet, seriesId: string, episode: number): boolean {
  if (!isEpisodeInSeries(episodeCountFor(seriesId), episode)) {
    return false;
  }

  if (episode <= FREE_EPISODE_LIMIT) {
    return true;
  }

  return wallet.unlocks.some(
    (unlock) => unlock.seriesId === seriesId && unlock.episode === episode,
  );
}

export function unlockEpisode(wallet: Wallet, seriesId: string, episode: number): Wallet {
  if (
    !isPaidEpisode(seriesId, episode) ||
    isEpisodeUnlocked(wallet, seriesId, episode) ||
    wallet.balance < EPISODE_COST
  ) {
    return wallet;
  }

  return {
    balance: wallet.balance - EPISODE_COST,
    unlocks: [...wallet.unlocks, { seriesId, episode }],
  };
}

export function purchaseCoins(wallet: Wallet, packIndex: number): Wallet {
  const pack = coinPacks[packIndex];
  if (!pack) {
    return wallet;
  }

  return addPack(wallet, pack);
}

export function grantCoinPack(wallet: Wallet, packId: string): Wallet | null {
  const pack = coinPacks.find((item) => item.id === packId);
  if (!pack) {
    return null;
  }

  return addPack(wallet, pack);
}

export function confirmUnlock(wallet: Wallet, seriesId: string, episode: number): UnlockDecision {
  if (!isPaidEpisode(seriesId, episode)) {
    if (isEpisodeInSeries(episodeCountFor(seriesId), episode) && episode <= FREE_EPISODE_LIMIT) {
      return { type: 'already-open', wallet };
    }

    return { type: 'rejected' };
  }

  if (isEpisodeUnlocked(wallet, seriesId, episode)) {
    return { type: 'already-open', wallet };
  }

  if (wallet.balance < EPISODE_COST) {
    return { type: 'insufficient', wallet };
  }

  const next = unlockEpisode(wallet, seriesId, episode);
  if (next === wallet) {
    return { type: 'rejected' };
  }

  return { type: 'unlocked', wallet: next };
}

export function serializeWallet(wallet: Wallet): string {
  return JSON.stringify({
    version: WALLET_SCHEMA_VERSION,
    balance: wallet.balance,
    unlocks: wallet.unlocks,
  });
}

// A missing key is a new install. Unreadable or incompatible data is corrupt.
// Corrupt data must not be replaced with a fresh 15-coin wallet.
export function loadWallet(storage: KeyValueStore): WalletLoadResult {
  let raw: string | null;

  try {
    raw = storage.getItem(WALLET_STORAGE_KEY);
  } catch {
    return { status: 'corrupt' };
  }

  if (raw === null) {
    return { status: 'ready', wallet: freshWallet() };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const wallet = parseStoredWallet(parsed);
    if (!wallet) {
      return { status: 'corrupt' };
    }

    return { status: 'ready', wallet };
  } catch {
    return { status: 'corrupt' };
  }
}

export async function readStoredWallet(storage: WalletStorage): Promise<WalletLoadResult> {
  try {
    const raw = await storage.getItem(WALLET_STORAGE_KEY);
    return loadWallet({ getItem: () => raw });
  } catch {
    return { status: 'corrupt' };
  }
}

export async function writeStoredWallet(storage: WalletStorage, wallet: Wallet): Promise<void> {
  await storage.setItem(WALLET_STORAGE_KEY, serializeWallet(wallet));
}

function addPack(wallet: Wallet, pack: (typeof coinPacks)[number]): Wallet {
  return { ...wallet, balance: wallet.balance + pack.coins + pack.bonus };
}

function isPaidEpisode(seriesId: string, episode: number): boolean {
  return isEpisodeInSeries(episodeCountFor(seriesId), episode) && episode > FREE_EPISODE_LIMIT;
}

function parseStoredWallet(value: unknown): Wallet | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as { version?: unknown; balance?: unknown; unlocks?: unknown };
  if (record.version !== undefined && record.version !== WALLET_SCHEMA_VERSION) {
    return null;
  }

  const candidate = { balance: record.balance, unlocks: record.unlocks };
  if (!isWalletRecord(candidate)) {
    return null;
  }

  return {
    balance: candidate.balance,
    unlocks: uniqueUnlocks(candidate.unlocks),
  };
}

function isWalletRecord(value: unknown): value is Wallet {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { balance?: unknown; unlocks?: unknown };
  return (
    typeof record.balance === 'number' &&
    Number.isSafeInteger(record.balance) &&
    record.balance >= 0 &&
    Array.isArray(record.unlocks) &&
    record.unlocks.every(isUnlock)
  );
}

function isUnlock(value: unknown): value is EpisodeUnlock {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const unlock = value as { seriesId?: unknown; episode?: unknown };
  return (
    typeof unlock.seriesId === 'string' &&
    typeof unlock.episode === 'number' &&
    isPaidEpisode(unlock.seriesId, unlock.episode)
  );
}

function uniqueUnlocks(unlocks: EpisodeUnlock[]): EpisodeUnlock[] {
  const seen = new Set<string>();
  return unlocks.filter((unlock) => {
    const key = `${unlock.seriesId}:${unlock.episode}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

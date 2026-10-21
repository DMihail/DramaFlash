import { episodeCountFor } from '@/data/catalog';

export const WALLET_STORAGE_KEY = 'dramaflash.option-a.v1';
export const EPISODE_COST = 10;
export const FREE_EPISODE_LIMIT = 3;
export const STARTING_BALANCE = 15;

export const coinPacks = [
  { coins: 300, bonus: 0, priceLabel: '€2.99' },
  { coins: 800, bonus: 50, priceLabel: '€6.99' },
  { coins: 2500, bonus: 200, priceLabel: '€19.99' },
  { coins: 6000, bonus: 1000, priceLabel: '€49.99' },
] as const;

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

  return { ...wallet, balance: wallet.balance + pack.coins + pack.bonus };
}

export function loadWallet(storage: KeyValueStore): Wallet {
  try {
    const value: unknown = JSON.parse(storage.getItem(WALLET_STORAGE_KEY) ?? 'null');
    if (!isWalletRecord(value)) {
      return freshWallet();
    }

    return {
      balance: value.balance,
      unlocks: uniqueUnlocks(value.unlocks),
    };
  } catch {
    return freshWallet();
  }
}

function isPaidEpisode(seriesId: string, episode: number): boolean {
  return isEpisodeInSeries(episodeCountFor(seriesId), episode) && episode > FREE_EPISODE_LIMIT;
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

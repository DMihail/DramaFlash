export const WALLET_STORAGE_KEY = 'dramaflash.option-a.v1';
export const EPISODE_COST = 10;
export const FREE_EPISODE_LIMIT = 3;
export const LAST_EPISODE = 45;
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

export function isEpisodeUnlocked(wallet: Wallet, seriesId: string, episode: number): boolean {
  if (!isPayableEpisode(seriesId, episode)) {
    return episode >= 1 && episode <= FREE_EPISODE_LIMIT && Number.isInteger(episode);
  }

  return wallet.unlocks.some((unlock) => unlock.seriesId === seriesId && unlock.episode === episode);
}

export function unlockEpisode(wallet: Wallet, seriesId: string, episode: number): Wallet {
  if (
    !isPayableEpisode(seriesId, episode) ||
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

function isPayableEpisode(seriesId: string, episode: number): boolean {
  return (
    seriesId.length > 0 &&
    Number.isInteger(episode) &&
    episode > FREE_EPISODE_LIMIT &&
    episode <= LAST_EPISODE
  );
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
    unlock.seriesId.length > 0 &&
    typeof unlock.episode === 'number' &&
    Number.isInteger(unlock.episode) &&
    unlock.episode > FREE_EPISODE_LIMIT &&
    unlock.episode <= LAST_EPISODE
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

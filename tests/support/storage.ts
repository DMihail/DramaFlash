import { WALLET_STORAGE_KEY, type WalletStorage } from '@/domain/wallet';
import { type LocalStorage, MMKV_WALLET_KEY } from '@/storage/persistence';

export function memoryLocal(initial: Record<string, string> = {}): LocalStorage & {
  snapshot: (key?: string) => string | null;
} {
  const data = new Map(Object.entries(initial));

  return {
    snapshot: (key = MMKV_WALLET_KEY) => data.get(key) ?? null,
    getString: (key) => data.get(key),
    setString: (key, value) => {
      data.set(key, value);
    },
    delete: (key) => {
      data.delete(key);
    },
  };
}

export function memoryLegacy(initial: string | null = null): WalletStorage & {
  snapshot: (key?: string) => string | null;
} {
  const data = new Map<string, string>();
  if (initial !== null) {
    data.set(WALLET_STORAGE_KEY, initial);
  }

  return {
    snapshot: (key = WALLET_STORAGE_KEY) => data.get(key) ?? null,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, next) => {
      data.set(key, next);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

export function walletRecord(value: string | null): Record<string, string> {
  if (value === null) {
    return {};
  }

  return { [MMKV_WALLET_KEY]: value };
}

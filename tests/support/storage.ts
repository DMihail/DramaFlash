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

export function walletRecord(value: string | null): Record<string, string> {
  if (value === null) {
    return {};
  }

  return { [MMKV_WALLET_KEY]: value };
}

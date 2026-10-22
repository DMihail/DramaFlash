import { type LocalStorage, STORAGE_NAMESPACE } from '@/storage/persistence';

export type WebStorageBackend = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * Browser storage for the same records MMKV holds on a phone.
 *
 * Keys are prefixed with `dramaflash.` so they do not collide with other
 * sites on the origin. Web and native installs do not share data. A missing
 * `localStorage` throws instead of inventing a new wallet.
 */
export function createWebStorage(
  backend: WebStorageBackend | null = browserStorage(),
): LocalStorage {
  return {
    getString: (key) => {
      if (!backend) {
        throw new Error('Browser storage is not available');
      }

      const value = backend.getItem(storageKey(key));
      return value === null ? undefined : value;
    },
    setString: (key, value) => {
      if (!backend) {
        throw new Error('Browser storage is not available');
      }

      backend.setItem(storageKey(key), value);
    },
    delete: (key) => {
      if (!backend) {
        throw new Error('Browser storage is not available');
      }

      backend.removeItem(storageKey(key));
    },
  };
}

export function browserStorage(): WebStorageBackend | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') {
      return null;
    }

    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function storageKey(key: string): string {
  return `${STORAGE_NAMESPACE}.${key}`;
}

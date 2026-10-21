import { createStore, type StoreApi } from 'zustand/vanilla';

import {
  confirmUnlock,
  freshWallet,
  grantCoinPack,
  type Wallet,
  WALLET_STORAGE_KEY,
  type WalletStorage,
} from '@/domain/wallet';
import { loadPersistedWallet } from '@/storage/migrations';
import {
  commitWallet,
  type LocalStorage,
  MMKV_MIGRATION_KEY,
  MMKV_WALLET_KEY,
  WALLET_ESTABLISHED_KEY,
  WALLET_ESTABLISHED_VALUE,
  WALLET_MIGRATION_COMPLETE,
  WALLET_RESET_MARKER,
} from '@/storage/persistence';

export type WalletActionResult =
  | { status: 'saved'; wallet: Wallet }
  | { status: 'unchanged'; wallet: Wallet }
  | { status: 'insufficient'; wallet: Wallet }
  | { status: 'rejected' }
  | { status: 'busy' }
  | { status: 'not-ready' }
  | { status: 'save-failed' };

export type WalletState = {
  status: 'loading' | 'ready' | 'error';
  wallet: Wallet | null;
  busy: boolean;
  hydrate: () => Promise<void>;
  retry: () => Promise<void>;
  unlock: (seriesId: string, episode: number) => Promise<WalletActionResult>;
  grantPack: (packId: string) => Promise<WalletActionResult>;
  resetDemo: () => Promise<'reset' | 'forbidden' | 'failed'>;
};

export type WalletStore = StoreApi<WalletState>;

type WalletStoreOptions = {
  allowReset: boolean;
  legacy: WalletStorage;
  local: LocalStorage;
};

type WalletChange =
  | { type: 'saved'; wallet: Wallet }
  | { type: 'unchanged'; wallet: Wallet }
  | { type: 'insufficient'; wallet: Wallet }
  | { type: 'rejected' };

// Subscribers see a new balance only after MMKV accepts it. Zustand persist
// would publish the change first, so wallet actions commit manually.
export function createWalletStore({ allowReset, legacy, local }: WalletStoreOptions): WalletStore {
  let lock = false;

  return createStore<WalletState>((set, get) => {
    const runTransaction = async (
      change: (wallet: Wallet) => WalletChange,
    ): Promise<WalletActionResult> => {
      if (lock) {
        return { status: 'busy' };
      }

      const current = get();
      if (current.status !== 'ready' || current.wallet === null) {
        return { status: 'not-ready' };
      }

      const decision = change(current.wallet);
      if (decision.type === 'rejected') {
        return { status: 'rejected' };
      }

      if (decision.type === 'insufficient') {
        return { status: 'insufficient', wallet: decision.wallet };
      }

      if (decision.type === 'unchanged') {
        return { status: 'unchanged', wallet: decision.wallet };
      }

      lock = true;
      set({ busy: true });

      try {
        await commitWallet(local, decision.wallet);
        await rememberSavedWallet(local, legacy);
        set({ wallet: decision.wallet, status: 'ready' });
        return { status: 'saved', wallet: decision.wallet };
      } catch {
        return { status: 'save-failed' };
      } finally {
        lock = false;
        set({ busy: false });
      }
    };

    return {
      status: 'loading',
      wallet: null,
      busy: false,
      hydrate: async () => {
        if (lock) {
          return;
        }

        lock = true;

        try {
          const result = await loadPersistedWallet(local, legacy);
          if (result.status === 'ready') {
            set({ status: 'ready', wallet: result.wallet });
            return;
          }

          set({ status: 'error', wallet: null });
        } catch {
          set({ status: 'error', wallet: null });
        } finally {
          lock = false;
        }
      },
      retry: () => {
        if (lock) {
          return Promise.resolve();
        }

        set({ status: 'loading', wallet: null });
        return get().hydrate();
      },
      unlock: (seriesId, episode) =>
        runTransaction((wallet) => {
          const decision = confirmUnlock(wallet, seriesId, episode);
          if (decision.type === 'unlocked') {
            return { type: 'saved', wallet: decision.wallet };
          }

          if (decision.type === 'already-open') {
            return { type: 'unchanged', wallet: decision.wallet };
          }

          if (decision.type === 'insufficient') {
            return { type: 'insufficient', wallet: decision.wallet };
          }

          return { type: 'rejected' };
        }),
      grantPack: (packId) =>
        runTransaction((wallet) => {
          const next = grantCoinPack(wallet, packId);
          if (!next) {
            return { type: 'rejected' };
          }

          return { type: 'saved', wallet: next };
        }),
      resetDemo: async () => {
        if (!allowReset) {
          return 'forbidden';
        }

        if (lock) {
          return 'failed';
        }

        lock = true;
        set({ busy: true });

        try {
          await legacy.removeItem(WALLET_STORAGE_KEY);
          await legacy.removeItem(WALLET_ESTABLISHED_KEY);
          await local.delete(MMKV_WALLET_KEY);
          await local.setString(MMKV_MIGRATION_KEY, WALLET_RESET_MARKER);
          set({ status: 'ready', wallet: freshWallet() });
          return 'reset';
        } catch {
          return 'failed';
        } finally {
          lock = false;
          set({ busy: false });
        }
      },
    };
  });
}

// The wallet JSON is already verified. These markers stop a later missing file
// from looking like a new 15-coin install. A failure here does not roll back
// the verified wallet.
async function rememberSavedWallet(local: LocalStorage, legacy: WalletStorage): Promise<void> {
  try {
    await local.setString(MMKV_MIGRATION_KEY, WALLET_MIGRATION_COMPLETE);
  } catch {
    // The next launch still reads the wallet key.
  }

  try {
    await legacy.setItem(WALLET_ESTABLISHED_KEY, WALLET_ESTABLISHED_VALUE);
  } catch {
    // The MMKV record is the source of truth.
  }
}

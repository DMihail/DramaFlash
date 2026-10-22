import { createStore, type StoreApi } from 'zustand/vanilla';

import { confirmUnlock, freshWallet, grantCoinPack, type Wallet } from '@/domain/wallet';
import {
  commitWallet,
  type LocalStorage,
  MMKV_WALLET_KEY,
  WALLET_MARKER_KEY,
  WALLET_RESET_MARKER,
  WALLET_SAVED_MARKER,
} from '@/storage/persistence';
import { loadPersistedWallet } from '@/storage/walletPersistence';

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
  local: LocalStorage;
};

type WalletChange =
  | { type: 'saved'; wallet: Wallet }
  | { type: 'unchanged'; wallet: Wallet }
  | { type: 'insufficient'; wallet: Wallet }
  | { type: 'rejected' };

// Subscribers see a new balance only after MMKV accepts it. Zustand persist
// would publish the change first, so wallet actions commit manually.
export function createWalletStore({ allowReset, local }: WalletStoreOptions): WalletStore {
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
        await rememberSavedWallet(local);
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
          const result = await loadPersistedWallet(local);
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
          await local.delete(MMKV_WALLET_KEY);
          await local.setString(WALLET_MARKER_KEY, WALLET_RESET_MARKER);
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

// The wallet JSON is already verified. The marker stops a later missing wallet
// from looking like a new 15-coin install. A failed marker write does not roll
// back the verified wallet; the next save writes it again.
async function rememberSavedWallet(local: LocalStorage): Promise<void> {
  try {
    await local.setString(WALLET_MARKER_KEY, WALLET_SAVED_MARKER);
  } catch {
    // The wallet key itself is still read first on the next launch.
  }
}

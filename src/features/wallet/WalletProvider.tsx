import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { useStore } from 'zustand';

import { type WalletStorage } from '@/domain/wallet';
import { type LocalStorage } from '@/storage/persistence';
import { createWalletStore, type WalletState, type WalletStore } from '@/stores/walletStore';

const WalletStoreContext = createContext<WalletStore | null>(null);

const emptyLegacy: WalletStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
};

const fallbackStore = createWalletStore({
  allowReset: false,
  legacy: emptyLegacy,
  local: {
    getString: () => undefined,
    setString: () => undefined,
    delete: () => undefined,
  },
});

// The provider only hands screens a store instance. Tests pass an in-memory
// store. Wallet data itself is not React context state.
export function WalletProvider({
  allowReset = false,
  children,
  legacy = emptyLegacy,
  local,
}: {
  allowReset?: boolean;
  children: ReactNode;
  legacy?: WalletStorage;
  local: LocalStorage;
}) {
  const [generation, setGeneration] = useState(() => ({
    allowReset,
    legacy,
    local,
    store: createWalletStore({ allowReset, legacy, local }),
  }));

  if (
    generation.allowReset !== allowReset ||
    generation.legacy !== legacy ||
    generation.local !== local
  ) {
    setGeneration({
      allowReset,
      legacy,
      local,
      store: createWalletStore({ allowReset, legacy, local }),
    });
  }

  const store = generation.store;

  useEffect(() => {
    void store.getState().hydrate();
  }, [store]);

  return <WalletStoreContext.Provider value={store}>{children}</WalletStoreContext.Provider>;
}

export function useWalletSelector<Selected>(selector: (state: WalletState) => Selected): Selected {
  const store = useContext(WalletStoreContext);
  const selected = useStore(store ?? fallbackStore, selector);
  if (!store) {
    throw new Error('Wallet store is missing');
  }

  return selected;
}

export function useOptionalWallet(): WalletState | null {
  const store = useContext(WalletStoreContext);
  const status = useStore(store ?? fallbackStore, (state) => state.status);
  const wallet = useStore(store ?? fallbackStore, (state) => state.wallet);
  const busy = useStore(store ?? fallbackStore, (state) => state.busy);
  const retry = useStore(store ?? fallbackStore, (state) => state.retry);
  const unlock = useStore(store ?? fallbackStore, (state) => state.unlock);
  const grantPack = useStore(store ?? fallbackStore, (state) => state.grantPack);
  const resetDemo = useStore(store ?? fallbackStore, (state) => state.resetDemo);
  const hydrate = useStore(store ?? fallbackStore, (state) => state.hydrate);

  if (!store) {
    return null;
  }

  return { status, wallet, busy, retry, unlock, grantPack, resetDemo, hydrate };
}

export function useWallet(): WalletState {
  const wallet = useOptionalWallet();
  if (!wallet) {
    throw new Error('Wallet store is missing');
  }

  return wallet;
}

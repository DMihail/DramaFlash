import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { useStore } from 'zustand';

import { type LocalStorage } from '@/storage/persistence';
import { type AuthState, type AuthStore, createAuthStore } from '@/stores/authStore';

const AuthStoreContext = createContext<AuthStore | null>(null);

const fallbackStore = createAuthStore({
  local: {
    getString: () => undefined,
    setString: () => undefined,
    delete: () => undefined,
  },
});

export function AuthProvider({ children, local }: { children: ReactNode; local: LocalStorage }) {
  const [generation, setGeneration] = useState(() => ({
    local,
    store: createAuthStore({ local }),
  }));

  if (generation.local !== local) {
    setGeneration({ local, store: createAuthStore({ local }) });
  }

  const store = generation.store;

  useEffect(() => {
    void store.getState().hydrate();
  }, [store]);

  return <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>;
}

export function useAuthSelector<Selected>(selector: (state: AuthState) => Selected): Selected {
  const store = useContext(AuthStoreContext);
  const selected = useStore(store ?? fallbackStore, selector);
  if (!store) {
    throw new Error('Auth store is missing');
  }

  return selected;
}

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { useStore } from 'zustand';

import { type LocalStorage } from '@/storage/persistence';
import { createLibraryStore, type LibraryState, type LibraryStore } from '@/stores/libraryStore';

const LibraryStoreContext = createContext<LibraryStore | null>(null);

const fallbackStore = createLibraryStore({
  allowReset: false,
  local: {
    getString: () => undefined,
    setString: () => undefined,
    delete: () => undefined,
  },
});

// The provider only hands screens a store instance. Library data is not React
// context state. Screens outside a provider keep the older login-ticket path.
export function LibraryProvider({
  allowReset = false,
  children,
  local,
}: {
  allowReset?: boolean;
  children: ReactNode;
  local: LocalStorage;
}) {
  const [generation, setGeneration] = useState(() => ({
    allowReset,
    local,
    store: createLibraryStore({ allowReset, local }),
  }));

  if (generation.allowReset !== allowReset || generation.local !== local) {
    setGeneration({
      allowReset,
      local,
      store: createLibraryStore({ allowReset, local }),
    });
  }

  const store = generation.store;

  useEffect(() => {
    void store.getState().hydrate();
  }, [store]);

  return <LibraryStoreContext.Provider value={store}>{children}</LibraryStoreContext.Provider>;
}

export function useLibrarySelector<Selected>(
  selector: (state: LibraryState) => Selected,
): Selected {
  const store = useContext(LibraryStoreContext);
  const selected = useStore(store ?? fallbackStore, selector);
  if (!store) {
    throw new Error('Library store is missing');
  }

  return selected;
}

export function useOptionalLibrarySelector<Selected>(
  selector: (state: LibraryState) => Selected,
): Selected | undefined {
  const store = useContext(LibraryStoreContext);
  const selected = useStore(store ?? fallbackStore, selector);
  if (!store) {
    return undefined;
  }

  return selected;
}

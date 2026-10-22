import { createStore, type StoreApi } from 'zustand/vanilla';

import { type DemoProvider } from '@/domain/auth';
import { type DemoSession } from '@/domain/session';
import { type LocalStorage } from '@/storage/persistence';
import { commitSession, loadPersistedSession } from '@/storage/sessionPersistence';

export type AuthActionResult =
  | { status: 'saved'; provider: DemoProvider | null }
  | { status: 'unchanged'; provider: DemoProvider | null }
  | { status: 'busy' }
  | { status: 'not-ready' }
  | { status: 'save-failed' };

export type AuthState = {
  status: 'loading' | 'ready' | 'error';
  provider: DemoProvider | null;
  busy: boolean;
  hydrate: () => Promise<void>;
  retry: () => Promise<void>;
  signIn: (provider: DemoProvider) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

export type AuthStore = StoreApi<AuthState>;

export function createAuthStore({ local }: { local: LocalStorage }): AuthStore {
  let lock = false;

  return createStore<AuthState>((set, get) => {
    const publish = async (session: DemoSession): Promise<AuthActionResult> => {
      const current = get().provider;
      if (current === session.provider) {
        return { status: 'unchanged', provider: current };
      }

      try {
        await commitSession(local, session);
      } catch {
        return { status: 'save-failed' };
      }

      set({ provider: session.provider, status: 'ready' });
      return { status: 'saved', provider: session.provider };
    };

    return {
      status: 'loading',
      provider: null,
      busy: false,
      hydrate: async () => {
        if (lock) {
          return;
        }

        lock = true;

        try {
          const result = await loadPersistedSession(local);
          if (result.status === 'error') {
            set({ status: 'error', provider: null, busy: false });
            return;
          }

          set({ status: 'ready', provider: result.session.provider, busy: false });
        } catch {
          set({ status: 'error', provider: null, busy: false });
        } finally {
          lock = false;
        }
      },
      retry: async () => {
        if (get().status === 'loading') {
          return;
        }

        set({ status: 'loading' });
        await get().hydrate();
      },
      signIn: async (provider) => {
        if (lock) {
          return { status: 'busy' };
        }

        if (get().status !== 'ready') {
          return { status: 'not-ready' };
        }

        lock = true;
        set({ busy: true });

        try {
          return await publish({ provider });
        } finally {
          lock = false;
          set({ busy: false });
        }
      },
      signOut: async () => {
        if (lock) {
          return { status: 'busy' };
        }

        if (get().status !== 'ready') {
          return { status: 'not-ready' };
        }

        lock = true;
        set({ busy: true });

        try {
          return await publish({ provider: null });
        } finally {
          lock = false;
          set({ busy: false });
        }
      },
    };
  });
}

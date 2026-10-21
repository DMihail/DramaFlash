import { createStore, type StoreApi } from 'zustand/vanilla';

import { findSeries } from '@/data/catalog';
import { type ProgressEntry, recordOpenedEpisode, toggleSeriesId } from '@/domain/library';
import { type Wallet } from '@/domain/wallet';
import {
  commitSavedSeries,
  commitViewingProgress,
  loadPersistedLibrary,
} from '@/storage/libraryPersistence';
import { type LocalStorage, MMKV_LIBRARY_KEY, MMKV_PROGRESS_KEY } from '@/storage/persistence';

export type LibrarySaveResult =
  | { status: 'saved'; savedSeriesIds: readonly string[] }
  | { status: 'removed'; savedSeriesIds: readonly string[] }
  | { status: 'rejected' }
  | { status: 'busy' }
  | { status: 'not-ready' }
  | { status: 'save-failed' };

export type ProgressSaveResult =
  | { status: 'saved' }
  | { status: 'ignored' }
  | { status: 'busy' }
  | { status: 'not-ready' }
  | { status: 'save-failed' };

export type LibraryState = {
  status: 'loading' | 'ready' | 'error';
  savedSeriesIds: readonly string[];
  entries: readonly ProgressEntry[];
  busy: boolean;
  hydrate: () => Promise<void>;
  retry: () => Promise<void>;
  toggleSave: (seriesId: string) => Promise<LibrarySaveResult>;
  rememberEpisode: (
    seriesId: string,
    episode: number,
    wallet: Wallet,
  ) => Promise<ProgressSaveResult>;
  resetLibrary: () => Promise<'reset' | 'forbidden' | 'failed'>;
};

export type LibraryStore = StoreApi<LibraryState>;

type LibraryStoreOptions = {
  allowReset: boolean;
  local: LocalStorage;
  now?: () => number;
};

// Saved series and the last opened episode share one store because Library
// reads both. Each record still has its own MMKV key and schema version.
export function createLibraryStore({
  allowReset,
  local,
  now = Date.now,
}: LibraryStoreOptions): LibraryStore {
  let lock = false;

  return createStore<LibraryState>((set, get) => ({
    status: 'loading',
    savedSeriesIds: [],
    entries: [],
    busy: false,
    hydrate: async () => {
      if (lock) {
        return;
      }

      lock = true;

      try {
        const result = await loadPersistedLibrary(local);
        if (result.status === 'ready') {
          set({
            status: 'ready',
            savedSeriesIds: result.savedSeriesIds,
            entries: result.entries,
          });
          return;
        }

        set({ status: 'error', savedSeriesIds: [], entries: [] });
      } catch {
        set({ status: 'error', savedSeriesIds: [], entries: [] });
      } finally {
        lock = false;
      }
    },
    retry: () => {
      if (lock) {
        return Promise.resolve();
      }

      set({ status: 'loading', savedSeriesIds: [], entries: [] });
      return get().hydrate();
    },
    toggleSave: async (seriesId) => {
      if (lock) {
        return { status: 'busy' };
      }

      const current = get();
      if (current.status !== 'ready') {
        return { status: 'not-ready' };
      }

      if (!findSeries(seriesId)) {
        return { status: 'rejected' };
      }

      const savedSeriesIds = toggleSeriesId(current.savedSeriesIds, seriesId);
      const saved = savedSeriesIds.includes(seriesId);
      lock = true;
      set({ busy: true });

      try {
        await commitSavedSeries(local, savedSeriesIds);
        set({ savedSeriesIds });
        return saved ? { status: 'saved', savedSeriesIds } : { status: 'removed', savedSeriesIds };
      } catch {
        return { status: 'save-failed' };
      } finally {
        lock = false;
        set({ busy: false });
      }
    },
    rememberEpisode: async (seriesId, episode, wallet) => {
      const current = get();
      if (current.status !== 'ready') {
        return { status: 'not-ready' };
      }

      const entries = recordOpenedEpisode(current.entries, seriesId, episode, now(), wallet);
      if (!entries) {
        return { status: 'ignored' };
      }

      if (lock) {
        return { status: 'busy' };
      }

      lock = true;
      set({ busy: true });

      try {
        await commitViewingProgress(local, entries);
        set({ entries });
        return { status: 'saved' };
      } catch {
        return { status: 'save-failed' };
      } finally {
        lock = false;
        set({ busy: false });
      }
    },
    resetLibrary: async () => {
      if (!allowReset) {
        return 'forbidden';
      }

      if (lock) {
        return 'failed';
      }

      lock = true;
      set({ busy: true });

      try {
        await local.delete(MMKV_LIBRARY_KEY);
        await local.delete(MMKV_PROGRESS_KEY);
        set({ status: 'ready', savedSeriesIds: [], entries: [] });
        return 'reset';
      } catch {
        return 'failed';
      } finally {
        lock = false;
        set({ busy: false });
      }
    },
  }));
}

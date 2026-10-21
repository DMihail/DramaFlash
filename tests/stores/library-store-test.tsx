import { serializeSavedSeries, serializeViewingProgress } from '@/domain/library';
import { freshWallet, unlockEpisode } from '@/domain/wallet';
import {
  type LocalStorage,
  MMKV_LIBRARY_KEY,
  MMKV_PROGRESS_KEY,
  MMKV_WALLET_KEY,
} from '@/storage/persistence';
import { createLibraryStore } from '@/stores/libraryStore';

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));

  return {
    snapshot(key: string) {
      return data.get(key) ?? null;
    },
    getString(key: string) {
      return data.get(key);
    },
    setString(key: string, value: string) {
      data.set(key, value);
    },
    delete(key: string) {
      data.delete(key);
    },
  };
}

function deferredMemory() {
  const data = new Map<string, string>();
  const pending: (() => void)[] = [];

  const local: LocalStorage & { release: () => void; snapshot: (key: string) => string | null } = {
    snapshot: (key) => data.get(key) ?? null,
    getString: (key) => data.get(key),
    setString: (key, value) =>
      new Promise<void>((resolve) => {
        pending.push(() => {
          data.set(key, value);
          resolve();
        });
      }),
    delete: (key) => {
      data.delete(key);
    },
    release: () => {
      pending.shift()?.();
    },
  };

  return local;
}

describe('library store', () => {
  test('saves, removes, and restarts without duplicates', async () => {
    const local = memory();
    let time = 10;
    const first = createLibraryStore({ allowReset: false, local, now: () => time });
    await first.getState().hydrate();

    const saved = await first.getState().toggleSave('the-ceo-and-i');
    const duplicate = await first.getState().toggleSave('my-secret-life');
    const again = await first.getState().toggleSave('the-ceo-and-i');

    expect(saved.status).toBe('saved');
    expect(duplicate.status).toBe('saved');
    expect(again.status).toBe('removed');
    expect(first.getState().savedSeriesIds).toEqual(['my-secret-life']);

    time = 20;
    expect(await first.getState().rememberEpisode('love-on-detours', 1, freshWallet())).toEqual({
      status: 'saved',
    });
    expect(await first.getState().rememberEpisode('love-on-detours', 4, freshWallet())).toEqual({
      status: 'ignored',
    });
    expect(await first.getState().rememberEpisode('band-of-fate', 26, freshWallet())).toEqual({
      status: 'ignored',
    });

    const restarted = createLibraryStore({ allowReset: false, local, now: () => time });
    await restarted.getState().hydrate();

    expect(restarted.getState().savedSeriesIds).toEqual(['my-secret-life']);
    expect(restarted.getState().entries).toEqual([
      { seriesId: 'love-on-detours', episode: 1, updatedAt: 20 },
    ]);
  });

  test('keeps a corrupt record and reports a failed write', async () => {
    const local = memory({
      [MMKV_LIBRARY_KEY]: '{',
      [MMKV_WALLET_KEY]: 'wallet-stays',
    });
    const store = createLibraryStore({ allowReset: true, local });
    await store.getState().hydrate();

    expect(store.getState().status).toBe('error');
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toBe('{');
    expect(await store.getState().toggleSave('shadow-kiss')).toEqual({ status: 'not-ready' });

    const failing = createLibraryStore({
      allowReset: false,
      local: {
        getString: () => undefined,
        setString: () => {
          throw new Error('full');
        },
        delete: () => undefined,
      },
    });
    await failing.getState().hydrate();
    expect(await failing.getState().toggleSave('shadow-kiss')).toEqual({ status: 'save-failed' });
    expect(failing.getState().savedSeriesIds).toEqual([]);
  });

  test('a second save is busy while the first write is still open', async () => {
    const local = deferredMemory();
    const store = createLibraryStore({ allowReset: false, local });
    await store.getState().hydrate();

    const first = store.getState().toggleSave('dark-desire');
    const second = await store.getState().toggleSave('dark-desire');

    expect(second).toEqual({ status: 'busy' });
    local.release();
    await Promise.resolve();
    local.release();
    expect((await first).status).toBe('saved');
    expect(store.getState().savedSeriesIds).toEqual(['dark-desire']);
  });

  test('development reset clears library data and leaves the wallet key', async () => {
    const local = memory({
      [MMKV_LIBRARY_KEY]: serializeSavedSeries(['shadow-kiss']),
      [MMKV_PROGRESS_KEY]: serializeViewingProgress([
        { seriesId: 'shadow-kiss', episode: 1, updatedAt: 1 },
      ]),
      [MMKV_WALLET_KEY]: 'wallet-stays',
    });
    const locked = createLibraryStore({ allowReset: false, local });
    await locked.getState().hydrate();
    expect(await locked.getState().resetLibrary()).toBe('forbidden');
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toContain('shadow-kiss');

    const store = createLibraryStore({ allowReset: true, local });
    await store.getState().hydrate();
    expect(await store.getState().resetLibrary()).toBe('reset');
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toBeNull();
    expect(local.snapshot(MMKV_PROGRESS_KEY)).toBeNull();
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe('wallet-stays');
    expect(store.getState().savedSeriesIds).toEqual([]);

    const unlocked = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);
    expect(await store.getState().rememberEpisode('the-ceo-and-i', 4, unlocked)).toEqual({
      status: 'saved',
    });
  });
});

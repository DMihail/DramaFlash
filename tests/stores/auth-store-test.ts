import { serializeSavedSeries } from '@/domain/library';
import { freshWallet, serializeWallet } from '@/domain/wallet';
import { MMKV_LIBRARY_KEY, MMKV_SESSION_KEY, MMKV_WALLET_KEY } from '@/storage/persistence';
import { createAuthStore } from '@/stores/authStore';

import { memoryLocal } from '../support/storage';

describe('auth store', () => {
  test('saves the demo provider and leaves wallet and library records alone', async () => {
    const wallet = serializeWallet(freshWallet());
    const library = serializeSavedSeries(['the-ceo-and-i']);
    const local = memoryLocal({
      [MMKV_WALLET_KEY]: wallet,
      [MMKV_LIBRARY_KEY]: library,
    });
    const store = createAuthStore({ local });

    await store.getState().hydrate();
    expect(store.getState().provider).toBeNull();

    await store.getState().signIn('email');
    expect(store.getState().provider).toBe('email');
    expect(local.snapshot(MMKV_SESSION_KEY)).not.toContain('@');
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(wallet);
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toBe(library);

    const reloaded = createAuthStore({ local });
    await reloaded.getState().hydrate();
    expect(reloaded.getState().provider).toBe('email');

    await reloaded.getState().signOut();
    expect(reloaded.getState().provider).toBeNull();
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(wallet);
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toBe(library);
  });

  test('keeps a broken session as an error and does not replace the wallet', async () => {
    const wallet = serializeWallet(freshWallet());
    const local = memoryLocal({
      [MMKV_SESSION_KEY]: '{',
      [MMKV_WALLET_KEY]: wallet,
    });
    const store = createAuthStore({ local });

    await store.getState().hydrate();

    expect(store.getState().status).toBe('error');
    expect(local.snapshot(MMKV_SESSION_KEY)).toBe('{');
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(wallet);
    expect(await store.getState().signIn('google')).toEqual({ status: 'not-ready' });
  });

  test('does not mark the session as loading when retry overlaps sign-in', async () => {
    const local = memoryLocal();
    let release: (() => void) | undefined;
    const originalSet = local.setString.bind(local);
    local.setString = (key, value) =>
      new Promise((resolve) => {
        release = () => {
          void originalSet(key, value);
          resolve();
        };
      });

    const store = createAuthStore({ local });
    await store.getState().hydrate();
    const signingIn = store.getState().signIn('google');

    for (let step = 0; step < 6 && !release; step += 1) {
      await Promise.resolve();
    }

    await store.getState().retry();

    expect(store.getState().status).toBe('ready');
    expect(store.getState().busy).toBe(true);
    if (!release) {
      throw new Error('expected the session write to wait');
    }

    release();
    await signingIn;

    expect(store.getState()).toMatchObject({
      status: 'ready',
      provider: 'google',
      busy: false,
    });
  });
});

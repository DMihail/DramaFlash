import { Pressable, Text } from 'react-native';

import TestRenderer, { act } from 'react-test-renderer';

import { freshWallet, serializeWallet, STARTING_BALANCE, unlockEpisode } from '@/domain/wallet';
import { useWalletSelector, WalletProvider } from '@/features/wallet/WalletProvider';
import {
  type LocalStorage,
  MMKV_WALLET_KEY,
  WALLET_MARKER_KEY,
  WALLET_RESET_MARKER,
  WALLET_SAVED_MARKER,
} from '@/storage/persistence';
import { createWalletStore } from '@/stores/walletStore';

import { memoryLocal, walletRecord } from '../support/storage';

const saved = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);

async function finishWrites(local: { release: () => void }, pending: Promise<unknown>) {
  let settled = false;
  void pending.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );

  for (let step = 0; step < 8 && !settled; step += 1) {
    await Promise.resolve();
    try {
      local.release();
    } catch {
      // The next saved-wallet marker is not queued yet.
    }
  }

  await pending;
}

function deferredLocal(): LocalStorage & { release: () => void } {
  const values = new Map<string, string>();
  const held: (() => void)[] = [];

  return {
    release: () => {
      const next = held.shift();
      if (!next) {
        throw new Error('expected a wallet write to be waiting');
      }

      next();
    },
    getString: (key) => values.get(key),
    setString: (key, value) =>
      new Promise((resolve) => {
        held.push(() => {
          values.set(key, value);
          resolve();
        });
      }),
    delete: (key) => {
      values.delete(key);
    },
  };
}

describe('wallet store', () => {
  test('stays empty until hydration and then restores a saved wallet', async () => {
    const local = memoryLocal(walletRecord(serializeWallet(saved)));
    const store = createWalletStore({ allowReset: false, local });

    expect(store.getState().status).toBe('loading');
    expect(store.getState().wallet).toBeNull();

    await store.getState().hydrate();

    expect(store.getState().status).toBe('ready');
    expect(store.getState().wallet).toEqual(saved);
  });

  test('shows an error for corrupt or unreadable storage and recovers on retry', async () => {
    const corruptLocal = memoryLocal({ [MMKV_WALLET_KEY]: '{' });
    const corrupt = createWalletStore({ allowReset: false, local: corruptLocal });
    await corrupt.getState().hydrate();

    expect(corrupt.getState()).toMatchObject({ status: 'error', wallet: null });
    // The broken record is kept for inspection, not replaced with 15 coins.
    expect(corruptLocal.snapshot()).toBe('{');

    const values = new Map([[MMKV_WALLET_KEY, serializeWallet(saved)]]);
    let failRead = true;
    const local: LocalStorage = {
      getString: (key) => {
        if (failRead) {
          throw new Error('storage unavailable');
        }

        return values.get(key);
      },
      setString: (key, value) => {
        values.set(key, value);
      },
      delete: (key) => {
        values.delete(key);
      },
    };
    const store = createWalletStore({ allowReset: false, local });
    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({ status: 'error', wallet: null });
    expect(values.get(MMKV_WALLET_KEY)).toBe(serializeWallet(saved));

    failRead = false;
    await store.getState().retry();

    expect(store.getState().wallet).toEqual(saved);
  });

  test('does not publish an unlock when the write fails', async () => {
    const local: LocalStorage = {
      getString: () => undefined,
      setString: () => {
        throw new Error('disk full');
      },
      delete: () => undefined,
    };
    const store = createWalletStore({
      allowReset: false,
      local,
    });
    await store.getState().hydrate();

    await expect(store.getState().unlock('the-ceo-and-i', 4)).resolves.toEqual({
      status: 'save-failed',
    });
    expect(store.getState().wallet).toEqual(freshWallet());
    expect(store.getState().busy).toBe(false);
  });

  test('blocks a second unlock and a competing coin grant until the write finishes', async () => {
    const local = deferredLocal();
    const store = createWalletStore({
      allowReset: false,
      local,
    });
    await store.getState().hydrate();

    const first = store.getState().unlock('the-ceo-and-i', 4);
    const second = store.getState().unlock('the-ceo-and-i', 5);
    await expect(second).resolves.toEqual({ status: 'busy' });
    await finishWrites(local, first);
    expect(store.getState().wallet).toEqual(saved);

    await expect(store.getState().unlock('the-ceo-and-i', 4)).resolves.toMatchObject({
      status: 'unchanged',
    });

    const grant = store.getState().grantPack('coins-300');
    const competing = store.getState().unlock('the-ceo-and-i', 5);
    await expect(competing).resolves.toEqual({ status: 'busy' });
    await finishWrites(local, grant);

    expect(store.getState().wallet?.balance).toBe(STARTING_BALANCE - 10 + 300);
    expect(store.getState().wallet?.unlocks).toEqual([{ seriesId: 'the-ceo-and-i', episode: 4 }]);
  });

  test('keeps the wallet after a new store reads the same storage', async () => {
    const local = memoryLocal();
    const first = createWalletStore({ allowReset: false, local });
    await first.getState().hydrate();
    await first.getState().grantPack('coins-800');

    const restarted = createWalletStore({ allowReset: false, local });
    await restarted.getState().hydrate();

    const restartedWallet = restarted.getState().wallet;
    if (!restartedWallet) {
      throw new Error('expected the saved wallet');
    }

    expect(restartedWallet.balance).toBe(STARTING_BALANCE + 850);
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(serializeWallet(restartedWallet));
  });

  test('resets only in development, then protects the next saved wallet again', async () => {
    const local = memoryLocal({
      [MMKV_WALLET_KEY]: serializeWallet(saved),
      [WALLET_MARKER_KEY]: WALLET_SAVED_MARKER,
    });
    const production = createWalletStore({ allowReset: false, local });
    await production.getState().hydrate();

    await expect(production.getState().resetDemo()).resolves.toBe('forbidden');
    expect(production.getState().wallet).toEqual(saved);
    expect(local.snapshot()).toBe(serializeWallet(saved));

    const development = createWalletStore({ allowReset: true, local });
    await development.getState().hydrate();
    await expect(development.getState().resetDemo()).resolves.toBe('reset');
    expect(development.getState().wallet).toEqual(freshWallet());
    expect(local.snapshot()).toBeNull();
    expect(local.snapshot(WALLET_MARKER_KEY)).toBe(WALLET_RESET_MARKER);

    // After a reset, a restart starts at 15 coins.
    const restarted = createWalletStore({ allowReset: true, local });
    await restarted.getState().hydrate();
    expect(restarted.getState().wallet).toEqual(freshWallet());

    // The first save after the reset marks the wallet as saved again.
    await restarted.getState().unlock('the-ceo-and-i', 4);
    expect(local.snapshot(WALLET_MARKER_KEY)).toBe(WALLET_SAVED_MARKER);
  });

  test('reports a saved wallet that later disappears instead of granting 15 coins', async () => {
    const local = memoryLocal();
    const store = createWalletStore({ allowReset: false, local });
    await store.getState().hydrate();
    await store.getState().unlock('the-ceo-and-i', 4);
    expect(local.snapshot(WALLET_MARKER_KEY)).toBe(WALLET_SAVED_MARKER);

    await local.delete(MMKV_WALLET_KEY);
    const restarted = createWalletStore({ allowReset: false, local });
    await restarted.getState().hydrate();

    expect(restarted.getState()).toMatchObject({ status: 'error', wallet: null });
  });

  test('updates a component through a balance selector', async () => {
    function BalanceLabel() {
      const balance = useWalletSelector((state) => state.wallet?.balance ?? null);
      const grantPack = useWalletSelector((state) => state.grantPack);

      return (
        <Pressable
          onPress={() => {
            void grantPack('coins-300');
          }}
          testID="grant"
        >
          <Text>{balance === null ? 'loading' : String(balance)}</Text>
        </Pressable>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <WalletProvider local={memoryLocal()}>
          <BalanceLabel />
        </WalletProvider>,
      );
      for (let step = 0; step < 10; step += 1) {
        await Promise.resolve();
      }
    });

    const text = () => renderer?.root.findByType(Text).props.children;
    expect(text()).toBe('15');

    await act(async () => {
      let current = renderer?.root.findByType(Text).parent;
      while (current) {
        const onPress = current.props.onPress as (() => void) | undefined;
        if (typeof onPress === 'function') {
          onPress();
          break;
        }

        current = current.parent;
      }

      for (let step = 0; step < 10; step += 1) {
        await Promise.resolve();
      }
    });

    expect(text()).toBe('315');
  });
});

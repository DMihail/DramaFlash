import { Pressable, Text } from 'react-native';

import TestRenderer, { act } from 'react-test-renderer';

import { freshWallet, serializeWallet, STARTING_BALANCE, unlockEpisode } from '@/domain/wallet';
import { useWalletSelector, WalletProvider } from '@/features/wallet/WalletProvider';
import {
  type LocalStorage,
  MMKV_MIGRATION_KEY,
  MMKV_WALLET_KEY,
  WALLET_MIGRATION_COMPLETE,
} from '@/storage/persistence';
import { createWalletStore } from '@/stores/walletStore';

import { memoryLegacy, memoryLocal, walletRecord } from '../support/storage';

const saved = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);

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
    const store = createWalletStore({
      allowReset: false,
      legacy: memoryLegacy(),
      local,
    });

    expect(store.getState().status).toBe('loading');
    expect(store.getState().wallet).toBeNull();

    await store.getState().hydrate();

    expect(store.getState().status).toBe('ready');
    expect(store.getState().wallet).toEqual(saved);
  });

  test('shows an error for corrupt storage and retries a failed migration', async () => {
    const corrupt = createWalletStore({
      allowReset: false,
      legacy: memoryLegacy(serializeWallet(saved)),
      local: memoryLocal({ [MMKV_WALLET_KEY]: '{' }),
    });
    await corrupt.getState().hydrate();

    expect(corrupt.getState()).toMatchObject({ status: 'error', wallet: null });

    const values = new Map<string, string>();
    let failWrite = true;
    const local: LocalStorage = {
      getString: (key) => values.get(key),
      setString: (key, value) => {
        if (failWrite) {
          throw new Error('disk full');
        }

        values.set(key, value);
      },
      delete: (key) => {
        values.delete(key);
      },
    };
    const legacy = memoryLegacy(serializeWallet(saved));
    const store = createWalletStore({ allowReset: false, legacy, local });
    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({ status: 'error', wallet: null });
    expect(legacy.snapshot()).toBe(serializeWallet(saved));

    failWrite = false;
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
      legacy: memoryLegacy(),
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
      legacy: memoryLegacy(),
      local,
    });
    await store.getState().hydrate();

    const first = store.getState().unlock('the-ceo-and-i', 4);
    const second = store.getState().unlock('the-ceo-and-i', 5);
    await expect(second).resolves.toEqual({ status: 'busy' });
    local.release();
    await expect(first).resolves.toMatchObject({ status: 'saved' });
    expect(store.getState().wallet).toEqual(saved);

    await expect(store.getState().unlock('the-ceo-and-i', 4)).resolves.toMatchObject({
      status: 'unchanged',
    });

    const grant = store.getState().grantPack('coins-300');
    const competing = store.getState().unlock('the-ceo-and-i', 5);
    await expect(competing).resolves.toEqual({ status: 'busy' });
    local.release();
    await grant;

    expect(store.getState().wallet?.balance).toBe(STARTING_BALANCE - 10 + 300);
    expect(store.getState().wallet?.unlocks).toEqual([{ seriesId: 'the-ceo-and-i', episode: 4 }]);
  });

  test('keeps the wallet after a new store reads the same storage', async () => {
    const local = memoryLocal();
    const first = createWalletStore({
      allowReset: false,
      legacy: memoryLegacy(),
      local,
    });
    await first.getState().hydrate();
    await first.getState().grantPack('coins-800');

    const restarted = createWalletStore({
      allowReset: false,
      legacy: memoryLegacy(serializeWallet(freshWallet())),
      local,
    });
    await restarted.getState().hydrate();

    const restartedWallet = restarted.getState().wallet;
    if (!restartedWallet) {
      throw new Error('expected the saved wallet');
    }

    expect(restartedWallet.balance).toBe(STARTING_BALANCE + 850);
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(serializeWallet(restartedWallet));
  });

  test('resets only in development and does not import the old AsyncStorage wallet again', async () => {
    const local = memoryLocal();
    const legacy = memoryLegacy(serializeWallet(saved));
    const production = createWalletStore({ allowReset: false, legacy, local });
    await production.getState().hydrate();

    await expect(production.getState().resetDemo()).resolves.toBe('forbidden');
    expect(production.getState().wallet).toEqual(saved);

    const development = createWalletStore({ allowReset: true, legacy, local });
    await development.getState().hydrate();
    await expect(development.getState().resetDemo()).resolves.toBe('reset');
    expect(development.getState().wallet).toEqual(freshWallet());
    expect(local.snapshot()).toBeNull();
    expect(local.snapshot(MMKV_MIGRATION_KEY)).toBe(WALLET_MIGRATION_COMPLETE);
    expect(legacy.snapshot()).toBeNull();

    await legacy.setItem('ignored', serializeWallet(saved));
    const restarted = createWalletStore({ allowReset: true, legacy, local });
    await restarted.getState().hydrate();

    expect(restarted.getState().wallet).toEqual(freshWallet());
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
        <WalletProvider legacy={memoryLegacy()} local={memoryLocal()}>
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

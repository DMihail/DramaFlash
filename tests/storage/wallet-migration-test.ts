import {
  freshWallet,
  serializeWallet,
  unlockEpisode,
  WALLET_SCHEMA_VERSION,
  type WalletStorage,
} from '@/domain/wallet';
import { loadPersistedWallet } from '@/storage/migrations';
import {
  type LocalStorage,
  MMKV_MIGRATION_KEY,
  MMKV_WALLET_KEY,
  WALLET_MIGRATION_COMPLETE,
} from '@/storage/persistence';

import { memoryLegacy, memoryLocal, walletRecord } from '../support/storage';

const saved = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);

describe('wallet storage migration', () => {
  test('starts a new install at 15 coins without writing a wallet', async () => {
    const local = memoryLocal();
    const legacy = memoryLegacy();

    await expect(loadPersistedWallet(local, legacy)).resolves.toEqual({
      status: 'ready',
      wallet: freshWallet(),
    });
    expect(local.snapshot()).toBeNull();
    expect(legacy.snapshot()).toBeNull();
  });

  test('reads a valid MMKV wallet and does not touch AsyncStorage', async () => {
    const local = memoryLocal(walletRecord(serializeWallet(saved)));
    const legacy: WalletStorage = {
      getItem: async () => {
        throw new Error('legacy should stay unread');
      },
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };

    await expect(loadPersistedWallet(local, legacy)).resolves.toEqual({
      status: 'ready',
      wallet: saved,
    });
  });

  test('rejects an invalid schema and corrupt JSON without granting 15 coins', async () => {
    const invalid = memoryLocal({
      [MMKV_WALLET_KEY]: JSON.stringify({
        version: WALLET_SCHEMA_VERSION + 1,
        balance: 15,
        unlocks: [],
      }),
    });
    const corrupt = memoryLocal({ [MMKV_WALLET_KEY]: '{' });
    const legacy = memoryLegacy(serializeWallet(saved));

    await expect(loadPersistedWallet(invalid, legacy)).resolves.toEqual({
      status: 'error',
      reason: 'corrupt',
    });
    await expect(loadPersistedWallet(corrupt, legacy)).resolves.toEqual({
      status: 'error',
      reason: 'corrupt',
    });
    expect(invalid.snapshot()).toContain('"version":2');
    expect(legacy.snapshot()).toBe(serializeWallet(saved));
  });

  test('copies a valid AsyncStorage wallet and leaves the legacy value in place', async () => {
    const local = memoryLocal();
    const legacy = memoryLegacy(serializeWallet(saved));
    const result = await loadPersistedWallet(local, legacy);

    expect(result).toEqual({ status: 'ready', wallet: saved });
    expect(local.snapshot()).toBe(serializeWallet(saved));
    expect(local.snapshot(MMKV_MIGRATION_KEY)).toBe(WALLET_MIGRATION_COMPLETE);
    expect(legacy.snapshot()).toBe(serializeWallet(saved));
  });

  test('keeps the MMKV wallet when an earlier copy finished before the migration mark', async () => {
    const local = memoryLocal(walletRecord(serializeWallet(saved)));
    const legacy = memoryLegacy(serializeWallet(freshWallet()));

    await expect(loadPersistedWallet(local, legacy)).resolves.toEqual({
      status: 'ready',
      wallet: saved,
    });
    expect(legacy.snapshot()).toBe(serializeWallet(freshWallet()));
    expect(local.snapshot()).toBe(serializeWallet(saved));
  });

  test('retries a failed copy without dropping the AsyncStorage wallet', async () => {
    const values = new Map<string, string>();
    let failWrite = true;
    const local: LocalStorage = {
      getString: (key) => values.get(key),
      setString: (key, value) => {
        if (failWrite && key === MMKV_WALLET_KEY) {
          throw new Error('disk full');
        }

        values.set(key, value);
      },
      delete: (key) => {
        values.delete(key);
      },
    };
    const legacy = memoryLegacy(serializeWallet(saved));

    await expect(loadPersistedWallet(local, legacy)).resolves.toEqual({
      status: 'error',
      reason: 'migration-failed',
    });
    expect(legacy.snapshot()).toBe(serializeWallet(saved));
    expect(values.has(MMKV_WALLET_KEY)).toBe(false);

    failWrite = false;

    await expect(loadPersistedWallet(local, legacy)).resolves.toEqual({
      status: 'ready',
      wallet: saved,
    });
    expect(values.get(MMKV_WALLET_KEY)).toBe(serializeWallet(saved));
    expect(legacy.snapshot()).toBe(serializeWallet(saved));
  });

  test('reports an unreadable store and a corrupt legacy wallet without resetting coins', async () => {
    const unreadable: LocalStorage = {
      getString: () => {
        throw new Error('unreadable');
      },
      setString: () => undefined,
      delete: () => undefined,
    };
    const legacy = memoryLegacy('{');

    await expect(loadPersistedWallet(unreadable, memoryLegacy())).resolves.toEqual({
      status: 'error',
      reason: 'unreadable',
    });
    await expect(loadPersistedWallet(memoryLocal(), legacy)).resolves.toEqual({
      status: 'error',
      reason: 'corrupt',
    });
    expect(legacy.snapshot()).toBe('{');
  });
});

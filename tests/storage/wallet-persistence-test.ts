import {
  freshWallet,
  serializeWallet,
  unlockEpisode,
  WALLET_SCHEMA_VERSION,
} from '@/domain/wallet';
import {
  type LocalStorage,
  MMKV_RECOVERY_STRATEGY,
  MMKV_WALLET_KEY,
  STORAGE_NAMESPACE,
  WALLET_MARKER_KEY,
  WALLET_RESET_MARKER,
  WALLET_SAVED_MARKER,
} from '@/storage/persistence';
import { loadPersistedWallet } from '@/storage/walletPersistence';

import { memoryLocal, walletRecord } from '../support/storage';

const saved = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);

describe('wallet persistence', () => {
  test('starts a new install at 15 coins without writing anything', async () => {
    const local = memoryLocal();

    await expect(loadPersistedWallet(local)).resolves.toEqual({
      status: 'ready',
      wallet: freshWallet(),
    });
    expect(local.snapshot()).toBeNull();
    expect(local.snapshot(WALLET_MARKER_KEY)).toBeNull();
  });

  test('reads a saved wallet with its unlocks', async () => {
    const local = memoryLocal({
      ...walletRecord(serializeWallet(saved)),
      [WALLET_MARKER_KEY]: WALLET_SAVED_MARKER,
    });

    await expect(loadPersistedWallet(local)).resolves.toEqual({ status: 'ready', wallet: saved });
  });

  test('keeps corrupt or incompatible data and reports it instead of granting 15 coins', async () => {
    for (const raw of [
      '{',
      '',
      JSON.stringify({ version: WALLET_SCHEMA_VERSION + 1, balance: 15, unlocks: [] }),
      '{"balance":-5,"unlocks":[]}',
    ]) {
      const local = memoryLocal(walletRecord(raw));

      await expect(loadPersistedWallet(local)).resolves.toEqual({
        status: 'error',
        reason: 'corrupt',
      });
      expect(local.snapshot()).toBe(raw);
    }
  });

  test('reports a missing wallet after one was saved', async () => {
    // MMKV recover-on-error can keep the marker and drop the wallet record.
    const local = memoryLocal({ [WALLET_MARKER_KEY]: WALLET_SAVED_MARKER });

    await expect(loadPersistedWallet(local)).resolves.toEqual({
      status: 'error',
      reason: 'missing',
    });
    expect(local.snapshot()).toBeNull();
    expect(MMKV_RECOVERY_STRATEGY).toBe('recover-on-error');
  });

  test('starts at 15 coins after an intentional development reset', async () => {
    const local = memoryLocal({ [WALLET_MARKER_KEY]: WALLET_RESET_MARKER });

    await expect(loadPersistedWallet(local)).resolves.toEqual({
      status: 'ready',
      wallet: freshWallet(),
    });
  });

  test('treats an unknown marker as corrupt', async () => {
    const local = memoryLocal({ [WALLET_MARKER_KEY]: 'something-else' });

    await expect(loadPersistedWallet(local)).resolves.toEqual({
      status: 'error',
      reason: 'corrupt',
    });
  });

  test('reports unreadable storage without touching it', async () => {
    const writes: string[] = [];
    const local: LocalStorage = {
      getString: () => {
        throw new Error('storage unavailable');
      },
      setString: (key) => {
        writes.push(key);
      },
      delete: (key) => {
        writes.push(key);
      },
    };

    await expect(loadPersistedWallet(local)).resolves.toEqual({
      status: 'error',
      reason: 'unreadable',
    });
    expect(writes).toEqual([]);
  });

  test('keeps the stored key names that installed builds already use', () => {
    // Released builds wrote these exact keys. Renaming them would make an
    // existing install look new and could hand out 15 coins after data loss.
    expect(STORAGE_NAMESPACE).toBe('dramaflash');
    expect(MMKV_WALLET_KEY).toBe('wallet');
    expect(WALLET_MARKER_KEY).toBe('wallet-migration');
    expect(WALLET_SAVED_MARKER).toBe('complete');
    expect(WALLET_RESET_MARKER).toBe('reset');
  });
});

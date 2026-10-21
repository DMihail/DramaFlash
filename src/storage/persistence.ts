import { loadWallet, serializeWallet, type Wallet } from '@/domain/wallet';

export const STORAGE_NAMESPACE = 'dramaflash';
export const MMKV_WALLET_KEY = 'wallet';
export const MMKV_MIGRATION_KEY = 'wallet-migration';
export const WALLET_MIGRATION_COMPLETE = 'complete';

export type LocalStorage = {
  getString: (key: string) => string | undefined | Promise<string | undefined>;
  setString: (key: string, value: string) => void | Promise<void>;
  delete: (key: string) => void | Promise<void>;
};

// Write the wallet, read it back, and only then let the caller publish it.
// A failed write restores the previous value when that is possible.
export async function commitWallet(local: LocalStorage, wallet: Wallet): Promise<void> {
  const payload = serializeWallet(wallet);
  const previous = await local.getString(MMKV_WALLET_KEY);

  try {
    await local.setString(MMKV_WALLET_KEY, payload);
    const readBack = await local.getString(MMKV_WALLET_KEY);
    if (readBack !== payload || loadWallet({ getItem: () => readBack }).status !== 'ready') {
      throw new Error('Wallet write could not be verified');
    }
  } catch (error) {
    await restoreWalletKey(local, previous);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Wallet write could not be verified');
  }
}

async function restoreWalletKey(local: LocalStorage, previous: string | undefined): Promise<void> {
  try {
    if (previous === undefined) {
      await local.delete(MMKV_WALLET_KEY);
      return;
    }

    await local.setString(MMKV_WALLET_KEY, previous);
  } catch {
    // The visible wallet stays unchanged either way.
  }
}

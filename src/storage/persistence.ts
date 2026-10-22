import { loadWallet, serializeWallet, type Wallet } from '@/domain/wallet';

export const STORAGE_NAMESPACE = 'dramaflash';
export const MMKV_WALLET_KEY = 'wallet';
export const MMKV_LIBRARY_KEY = 'library';
export const MMKV_PROGRESS_KEY = 'progress';
export const MMKV_SESSION_KEY = 'session';
export const MMKV_MIGRATION_KEY = 'wallet-migration';
export const WALLET_MIGRATION_COMPLETE = 'complete';
export const WALLET_RESET_MARKER = 'reset';
export const WALLET_ESTABLISHED_KEY = 'dramaflash.wallet-established.v1';
export const WALLET_ESTABLISHED_VALUE = '1';
// Keep records MMKV can still read. discard-on-error deletes the file and can
// look like a new install.
export const MMKV_RECOVERY_STRATEGY = 'recover-on-error' as const;

export type LocalStorage = {
  getString: (key: string) => string | undefined | Promise<string | undefined>;
  setString: (key: string, value: string) => void | Promise<void>;
  delete: (key: string) => void | Promise<void>;
};

const walletWriteError = 'Wallet write could not be verified';

/**
 * Writes one record, reads it back, and restores the previous bytes when the
 * check fails.
 *
 * The caller must publish the new value only after this resolves. A failed
 * restore leaves that in-memory value unchanged.
 *
 * @param accept - Returns true only when `readBack` parses as the record that
 *   was just written.
 * @throws Error with `failureMessage` when the write cannot be verified.
 */
export async function commitVerifiedRecord(
  local: LocalStorage,
  key: string,
  payload: string,
  accept: (readBack: string) => boolean,
  failureMessage: string,
): Promise<void> {
  const previous = await local.getString(key);

  try {
    await local.setString(key, payload);
    const readBack = await local.getString(key);
    if (readBack === undefined || readBack !== payload || !accept(readBack)) {
      throw new Error(failureMessage);
    }
  } catch (error) {
    await restoreStoredKey(local, key, previous);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(failureMessage);
  }
}

async function restoreStoredKey(
  local: LocalStorage,
  key: string,
  previous: string | undefined,
): Promise<void> {
  try {
    if (previous === undefined) {
      await local.delete(key);
      return;
    }

    await local.setString(key, previous);
  } catch {
    // The in-memory record stays unchanged when the old bytes cannot be put back.
  }
}

/** Saves the wallet and checks the stored JSON before the UI may show it. */
export async function commitWallet(local: LocalStorage, wallet: Wallet): Promise<void> {
  const payload = serializeWallet(wallet);

  await commitVerifiedRecord(
    local,
    MMKV_WALLET_KEY,
    payload,
    (readBack) => loadWallet({ getItem: () => readBack }).status === 'ready',
    walletWriteError,
  );
}

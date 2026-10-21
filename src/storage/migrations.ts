import {
  freshWallet,
  loadWallet,
  type Wallet,
  WALLET_STORAGE_KEY,
  type WalletStorage,
} from '@/domain/wallet';
import {
  commitWallet,
  type LocalStorage,
  MMKV_MIGRATION_KEY,
  MMKV_WALLET_KEY,
  WALLET_MIGRATION_COMPLETE,
} from '@/storage/persistence';

export type PersistedWalletResult =
  | { status: 'ready'; wallet: Wallet }
  | { status: 'error'; reason: 'corrupt' | 'migration-failed' | 'unreadable' };

// Schema 1 is the wallet JSON written by serializeWallet. Any other version is
// rejected by loadWallet. A missing MMKV wallet is not a schema error.
export async function loadPersistedWallet(
  local: LocalStorage,
  legacy: WalletStorage,
): Promise<PersistedWalletResult> {
  let stored: string | undefined;
  try {
    stored = await local.getString(MMKV_WALLET_KEY);
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  if (stored !== undefined) {
    return acceptStoredWallet(stored);
  }

  let mark: string | undefined;
  try {
    mark = await local.getString(MMKV_MIGRATION_KEY);
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  if (mark === WALLET_MIGRATION_COMPLETE) {
    return { status: 'ready', wallet: freshWallet() };
  }

  if (mark !== undefined) {
    return { status: 'error', reason: 'corrupt' };
  }

  let legacyRaw: string | null;
  try {
    legacyRaw = await legacy.getItem(WALLET_STORAGE_KEY);
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  if (legacyRaw === null) {
    return { status: 'ready', wallet: freshWallet() };
  }

  const parsed = loadWallet({ getItem: () => legacyRaw });
  if (parsed.status === 'corrupt') {
    return { status: 'error', reason: 'corrupt' };
  }

  try {
    await commitWallet(local, parsed.wallet);
  } catch {
    return { status: 'error', reason: 'migration-failed' };
  }

  const verified = await local.getString(MMKV_WALLET_KEY);
  if (serializeMatches(verified, parsed.wallet)) {
    try {
      await local.setString(MMKV_MIGRATION_KEY, WALLET_MIGRATION_COMPLETE);
    } catch {
      // The copied wallet is already verified. The next launch reads MMKV.
    }

    return { status: 'ready', wallet: parsed.wallet };
  }

  return { status: 'error', reason: 'migration-failed' };
}

function acceptStoredWallet(stored: string): PersistedWalletResult {
  const parsed = loadWallet({ getItem: () => stored });
  if (parsed.status === 'corrupt') {
    return { status: 'error', reason: 'corrupt' };
  }

  return { status: 'ready', wallet: parsed.wallet };
}

function serializeMatches(stored: string | undefined, wallet: Wallet): boolean {
  if (stored === undefined) {
    return false;
  }

  const parsed = loadWallet({ getItem: () => stored });
  return parsed.status === 'ready' && sameWallet(parsed.wallet, wallet);
}

function sameWallet(left: Wallet, right: Wallet): boolean {
  return (
    left.balance === right.balance &&
    left.unlocks.length === right.unlocks.length &&
    left.unlocks.every(
      (unlock, index) =>
        unlock.seriesId === right.unlocks[index]?.seriesId &&
        unlock.episode === right.unlocks[index]?.episode,
    )
  );
}

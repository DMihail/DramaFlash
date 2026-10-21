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
  WALLET_ESTABLISHED_KEY,
  WALLET_ESTABLISHED_VALUE,
  WALLET_MIGRATION_COMPLETE,
  WALLET_RESET_MARKER,
} from '@/storage/persistence';

export type PersistedWalletResult =
  | { status: 'ready'; wallet: Wallet }
  | { status: 'error'; reason: 'corrupt' | 'migration-failed' | 'missing' | 'unreadable' };

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

  if (mark === WALLET_RESET_MARKER) {
    return { status: 'ready', wallet: freshWallet() };
  }

  // A completed copy means a wallet was saved. A missing record after that is
  // data loss, including when MMKV recovery keeps the marker and drops the wallet.
  if (mark === WALLET_MIGRATION_COMPLETE) {
    return { status: 'error', reason: 'missing' };
  }

  if (mark !== undefined) {
    return { status: 'error', reason: 'corrupt' };
  }

  const established = await readEstablished(legacy);
  if (established === 'unreadable') {
    return { status: 'error', reason: 'unreadable' };
  }

  if (established === 'yes') {
    return { status: 'error', reason: 'missing' };
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

    try {
      await legacy.setItem(WALLET_ESTABLISHED_KEY, WALLET_ESTABLISHED_VALUE);
    } catch {
      // The MMKV copy is already verified.
    }

    return { status: 'ready', wallet: parsed.wallet };
  }

  return { status: 'error', reason: 'migration-failed' };
}

async function readEstablished(legacy: WalletStorage): Promise<'yes' | 'no' | 'unreadable'> {
  try {
    const value = await legacy.getItem(WALLET_ESTABLISHED_KEY);
    if (value === null) {
      return 'no';
    }

    if (value === WALLET_ESTABLISHED_VALUE) {
      return 'yes';
    }

    return 'unreadable';
  } catch {
    return 'unreadable';
  }
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

import { freshWallet, parseWallet, type Wallet } from '@/domain/wallet';
import {
  type LocalStorage,
  MMKV_WALLET_KEY,
  WALLET_MARKER_KEY,
  WALLET_RESET_MARKER,
  WALLET_SAVED_MARKER,
} from '@/storage/persistence';

export type PersistedWalletResult =
  | { status: 'ready'; wallet: Wallet }
  | { status: 'error'; reason: 'corrupt' | 'missing' | 'unreadable' };

/**
 * Loads the wallet without turning a lost record into a new 15-coin balance.
 *
 * - A stored wallet is parsed. Broken or incompatible JSON is `corrupt`.
 * - No wallet and no marker is a new install: 15 coins, nothing written yet.
 * - No wallet after the saved marker is `missing` (for example when MMKV
 *   recovery keeps the marker and drops the wallet).
 * - The development reset marker starts a fresh wallet.
 * - A storage read that throws is `unreadable`.
 */
export async function loadPersistedWallet(local: LocalStorage): Promise<PersistedWalletResult> {
  let stored: string | undefined;
  let marker: string | undefined;
  try {
    stored = await local.getString(MMKV_WALLET_KEY);
    marker = stored === undefined ? await local.getString(WALLET_MARKER_KEY) : undefined;
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  if (stored !== undefined) {
    const wallet = parseWallet(stored);
    return wallet ? { status: 'ready', wallet } : { status: 'error', reason: 'corrupt' };
  }

  if (marker === undefined || marker === WALLET_RESET_MARKER) {
    return { status: 'ready', wallet: freshWallet() };
  }

  if (marker === WALLET_SAVED_MARKER) {
    return { status: 'error', reason: 'missing' };
  }

  return { status: 'error', reason: 'corrupt' };
}

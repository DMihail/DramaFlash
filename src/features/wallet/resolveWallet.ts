import { freshWallet, type Wallet } from '@/domain/wallet';

export type WalletSnapshot = {
  status: 'loading' | 'ready' | 'error';
  wallet: Wallet | null;
};

export type ResolvedWallet =
  { kind: 'ready'; wallet: Wallet } | { kind: 'loading' } | { kind: 'error' };

// An explicit wallet wins. Outside the provider, screens keep the 15-coin demo.
// A provider that is still loading must not fall through to that demo balance.
export function resolveScreenWallet(
  override: Wallet | undefined,
  shared: WalletSnapshot | null,
): ResolvedWallet {
  if (override) {
    return { kind: 'ready', wallet: override };
  }

  if (!shared) {
    return { kind: 'ready', wallet: freshWallet() };
  }

  if (shared.status === 'ready' && shared.wallet) {
    return { kind: 'ready', wallet: shared.wallet };
  }

  if (shared.status === 'error') {
    return { kind: 'error' };
  }

  return { kind: 'loading' };
}

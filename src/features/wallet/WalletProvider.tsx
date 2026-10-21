import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

import {
  confirmUnlock,
  freshWallet,
  grantCoinPack,
  readStoredWallet,
  type Wallet,
  WALLET_STORAGE_KEY,
  type WalletStorage,
  writeStoredWallet,
} from '@/domain/wallet';

export type WalletActionResult =
  | { status: 'saved'; wallet: Wallet }
  | { status: 'unchanged'; wallet: Wallet }
  | { status: 'insufficient'; wallet: Wallet }
  | { status: 'rejected' }
  | { status: 'busy' }
  | { status: 'not-ready' }
  | { status: 'save-failed' };

type WalletStatus = 'loading' | 'ready' | 'error';

export type WalletContextValue = {
  status: WalletStatus;
  wallet: Wallet | null;
  busy: boolean;
  retry: () => void;
  unlock: (seriesId: string, episode: number) => Promise<WalletActionResult>;
  grantPack: (packId: string) => Promise<WalletActionResult>;
  resetDemo: () => Promise<'reset' | 'forbidden' | 'failed'>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({
  allowReset = false,
  children,
  storage,
}: {
  allowReset?: boolean;
  children: ReactNode;
  storage: WalletStorage;
}) {
  const [status, setStatus] = useState<WalletStatus>('loading');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    let active = true;

    readStoredWallet(storage)
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.status === 'corrupt') {
          setWallet(null);
          setStatus('error');
          return;
        }

        setWallet(result.wallet);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setWallet(null);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [attempt, storage]);

  const retry = () => {
    setStatus('loading');
    setWallet(null);
    setAttempt((current) => current + 1);
  };

  const unlock = async (seriesId: string, episode: number): Promise<WalletActionResult> => {
    if (status !== 'ready' || wallet === null) {
      return { status: 'not-ready' };
    }

    if (lock.current) {
      return { status: 'busy' };
    }

    lock.current = true;
    setBusy(true);

    try {
      const decision = confirmUnlock(wallet, seriesId, episode);
      if (decision.type === 'rejected') {
        return { status: 'rejected' };
      }

      if (decision.type === 'insufficient') {
        return { status: 'insufficient', wallet };
      }

      if (decision.type === 'already-open') {
        return { status: 'unchanged', wallet };
      }

      try {
        await writeStoredWallet(storage, decision.wallet);
      } catch {
        return { status: 'save-failed' };
      }

      setWallet(decision.wallet);
      return { status: 'saved', wallet: decision.wallet };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const grantPack = async (packId: string): Promise<WalletActionResult> => {
    if (status !== 'ready' || wallet === null) {
      return { status: 'not-ready' };
    }

    if (lock.current) {
      return { status: 'busy' };
    }

    lock.current = true;
    setBusy(true);

    try {
      const next = grantCoinPack(wallet, packId);
      if (!next) {
        return { status: 'rejected' };
      }

      try {
        await writeStoredWallet(storage, next);
      } catch {
        return { status: 'save-failed' };
      }

      setWallet(next);
      return { status: 'saved', wallet: next };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const resetDemo = async (): Promise<'reset' | 'forbidden' | 'failed'> => {
    if (!allowReset) {
      return 'forbidden';
    }

    if (lock.current) {
      return 'failed';
    }

    lock.current = true;
    setBusy(true);

    try {
      await storage.removeItem(WALLET_STORAGE_KEY);
      setWallet(freshWallet());
      setStatus('ready');
      return 'reset';
    } catch {
      return 'failed';
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const value: WalletContextValue = {
    status,
    wallet,
    busy,
    retry,
    unlock,
    grantPack,
    resetDemo,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error('WalletProvider is missing');
  }

  return value;
}

export function useOptionalWallet(): WalletContextValue | null {
  return useContext(WalletContext);
}

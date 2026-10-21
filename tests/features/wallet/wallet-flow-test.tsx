import { type ReactElement } from 'react';
import { Animated } from 'react-native';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { loadPlayerEpisode, type PlayerRequestOptions } from '@/api/player';
import { loadSeriesDetails, type SeriesRequestOptions } from '@/api/series';
import {
  freshWallet,
  serializeWallet,
  STARTING_BALANCE,
  unlockEpisode,
  type Wallet,
  type WalletStorage,
} from '@/domain/wallet';
import { CoinStoreScreen } from '@/features/coins/CoinStoreScreen';
import { demoPurchaseSuccess } from '@/features/coins/model';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { SeriesDetailsScreen } from '@/features/series/SeriesDetailsScreen';
import {
  useWallet,
  type WalletContextValue,
  WalletProvider,
} from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockRouter.back(...args),
    canGoBack: () => mockRouter.canGoBack(),
    navigate: (...args: unknown[]) => mockRouter.navigate(...args),
    push: (...args: unknown[]) => mockRouter.push(...args),
    replace: (...args: unknown[]) => mockRouter.replace(...args),
  },
}));

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return new Proxy({}, { get: () => Icon });
});

let activeRenderer: TestRenderer.ReactTestRenderer | undefined;

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function memoryStorage(
  initial: string | null = null,
): WalletStorage & { snapshot: () => string | null } {
  let value = initial;

  return {
    snapshot: () => value,
    getItem: async () => value,
    setItem: async (_key, next) => {
      value = next;
    },
    removeItem: async () => {
      value = null;
    },
  };
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const node = renderer.root.findAll((item) => item.props.testID === testID).at(-1);
  let current = node;
  while (current) {
    const onPress = current.props.onPress as (() => void) | undefined;
    if (typeof onPress === 'function') {
      onPress();
      return;
    }

    current = current.parent ?? undefined;
  }

  throw new Error(`missing press for ${testID}`);
}

function Probe({ onReady }: { onReady: (wallet: WalletContextValue) => void }) {
  const wallet = useWallet();
  onReady(wallet);

  if (wallet.status === 'loading') {
    return null;
  }

  return null;
}

function asApi(value: WalletContextValue | null): WalletContextValue | null {
  return value;
}

function requireWallet(value: WalletContextValue | null): Wallet {
  if (!value || value.wallet === null) {
    throw new Error('expected a wallet');
  }

  return value.wallet;
}

async function renderTree(ui: ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  await act(async () => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>,
    );
    await Promise.resolve();
  });

  if (!renderer) {
    throw new Error('expected a screen');
  }

  activeRenderer = renderer;
  return renderer;
}

describe('wallet flow', () => {
  beforeEach(() => {
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });
    mockRouter.back.mockClear();
    mockRouter.canGoBack.mockReturnValue(false);
    mockRouter.navigate.mockClear();
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      activeRenderer?.unmount();
    });
    activeRenderer = undefined;
    jest.restoreAllMocks();
  });

  test('hydrates a new install to 15 coins and keeps that balance after restart', async () => {
    const storage = memoryStorage();
    let wallet: WalletContextValue | null = null;
    const screen = await renderTree(
      <WalletProvider storage={storage}>
        <Probe onReady={(value) => (wallet = value)} />
      </WalletProvider>,
    );

    expect(asApi(wallet)?.status).toBe('ready');
    expect(asApi(wallet)?.wallet).toEqual(freshWallet());
    expect(storage.snapshot()).toBeNull();

    const saved = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);
    const restored = memoryStorage(serializeWallet(saved));
    let again: WalletContextValue | null = null;

    await act(async () => {
      screen.update(
        <SafeAreaProvider initialMetrics={metrics}>
          <WalletProvider storage={restored}>
            <Probe onReady={(value) => (again = value)} />
          </WalletProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    expect(requireWallet(again)).toEqual(saved);
    expect(requireWallet(again).balance).toBe(5);
  });

  test('shows loading, then an error for corrupt storage without granting 15 coins', async () => {
    let resolveRead: (value: string | null) => void = () => undefined;
    const storage: WalletStorage = {
      getItem: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };
    let wallet: WalletContextValue | null = null;
    const screen = await renderTree(
      <WalletProvider storage={storage}>
        <Probe onReady={(value) => (wallet = value)} />
      </WalletProvider>,
    );

    expect(asApi(wallet)?.status).toBe('loading');

    await act(async () => {
      resolveRead('{');
      await Promise.resolve();
    });

    expect(asApi(wallet)?.status).toBe('error');
    expect(asApi(wallet)?.wallet).toBeNull();
    expect(textOf(screen)).not.toContain('15 coins');
  });

  test('retries a failed read and refuses a demo reset in production', async () => {
    let fail = true;
    const storage = memoryStorage();
    const reading: WalletStorage = {
      getItem: async () => {
        if (fail) {
          throw new Error('unreadable');
        }

        return storage.snapshot();
      },
      setItem: storage.setItem,
      removeItem: storage.removeItem,
    };
    const holder: { api: WalletContextValue | null } = { api: null };
    await renderTree(
      <WalletProvider allowReset={false} storage={reading}>
        <Probe
          onReady={(value) => {
            holder.api = value;
          }}
        />
      </WalletProvider>,
    );

    if (!holder.api) {
      throw new Error('expected the wallet');
    }

    expect(holder.api.status).toBe('error');
    fail = false;

    await act(async () => {
      holder.api?.retry();
      await Promise.resolve();
    });

    if (!holder.api) {
      throw new Error('expected the wallet');
    }

    expect(holder.api.status).toBe('ready');
    expect(requireWallet(holder.api).balance).toBe(STARTING_BALANCE);
    await expect(holder.api.resetDemo()).resolves.toBe('forbidden');
    expect(storage.snapshot()).toBeNull();
  });

  test('charges 10 coins once when two unlocks race, and keeps the old balance if saving fails', async () => {
    const held: (() => void)[] = [];
    let saved: string | null = null;
    const storage: WalletStorage = {
      getItem: async () => saved,
      setItem: () =>
        new Promise((resolve) => {
          held.push(() => {
            resolve();
          });
        }),
      removeItem: async () => {
        saved = null;
      },
    };
    let wallet: WalletContextValue | null = null;
    await renderTree(
      <WalletProvider storage={storage}>
        <Probe onReady={(value) => (wallet = value)} />
      </WalletProvider>,
    );

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    await act(async () => {
      first = wallet?.unlock('the-ceo-and-i', 4);
      second = wallet?.unlock('the-ceo-and-i', 4);
    });

    await expect(second).resolves.toEqual({ status: 'busy' });
    const release = held[0];
    if (!release) {
      throw new Error('expected the save to wait');
    }

    saved = serializeWallet(unlockEpisode(freshWallet(), 'the-ceo-and-i', 4));
    await act(async () => {
      release();
      await first;
    });

    expect(requireWallet(wallet).balance).toBe(5);
    expect(requireWallet(wallet).unlocks).toEqual([{ seriesId: 'the-ceo-and-i', episode: 4 }]);

    const failing: WalletStorage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full');
      },
      removeItem: async () => undefined,
    };
    let failed: WalletContextValue | null = null;
    await renderTree(
      <WalletProvider storage={failing}>
        <Probe onReady={(value) => (failed = value)} />
      </WalletProvider>,
    );

    let result: unknown;
    await act(async () => {
      result = await failed?.unlock('the-ceo-and-i', 4);
    });

    expect(result).toEqual({ status: 'save-failed' });
    expect(asApi(failed)?.wallet).toEqual(freshWallet());
  });

  test('lets an unlock and a coin grant compete without applying both', async () => {
    const held: (() => void)[] = [];
    const storage: WalletStorage = {
      getItem: async () => null,
      setItem: () =>
        new Promise((resolve) => {
          held.push(() => resolve());
        }),
      removeItem: async () => undefined,
    };
    let wallet: WalletContextValue | null = null;
    await renderTree(
      <WalletProvider storage={storage}>
        <Probe onReady={(value) => (wallet = value)} />
      </WalletProvider>,
    );

    let grant: Promise<unknown> | undefined;
    let unlock: Promise<unknown> | undefined;
    await act(async () => {
      grant = wallet?.grantPack('coins-300');
      unlock = wallet?.unlock('the-ceo-and-i', 4);
    });

    await expect(unlock).resolves.toEqual({ status: 'busy' });
    const release = held[0];
    if (!release) {
      throw new Error('expected the grant to wait');
    }

    await act(async () => {
      release();
      await grant;
    });

    expect(requireWallet(wallet).balance).toBe(STARTING_BALANCE + 300);
    expect(requireWallet(wallet).unlocks).toEqual([]);
  });

  test('adds a demo pack once and returns to the same episode', async () => {
    const storage = memoryStorage();
    const screen = await renderTree(
      <WalletProvider storage={storage}>
        <CoinStoreScreen episode="4" seriesId="the-ceo-and-i" />
      </WalletProvider>,
    );

    expect(textOf(screen)).toContain('15 coins');
    expect(textOf(screen)).toContain('Episode 4 is locked');

    await act(async () => {
      press(screen, testIds.coins.package('coins-300'));
      press(screen, testIds.coins.purchaseConfirm);
      await Promise.resolve();
    });

    expect(textOf(screen)).toContain(demoPurchaseSuccess);
    expect(textOf(screen)).toContain('315 coins');

    await act(async () => {
      press(screen, testIds.coins.purchaseConfirm);
      await Promise.resolve();
    });

    expect(textOf(screen)).toContain('615 coins');

    const blocked: (() => void)[] = [];
    const slow: WalletStorage = {
      getItem: async () => null,
      setItem: () =>
        new Promise((resolve) => {
          blocked.push(resolve);
        }),
      removeItem: async () => undefined,
    };
    let current: WalletContextValue | null = null;
    await renderTree(
      <WalletProvider storage={slow}>
        <Probe onReady={(value) => (current = value)} />
      </WalletProvider>,
    );

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    await act(async () => {
      first = current?.grantPack('coins-300');
      second = current?.grantPack('coins-300');
    });

    await expect(second).resolves.toEqual({ status: 'busy' });
    await act(async () => {
      blocked[0]?.();
      await first;
    });

    expect(requireWallet(current).balance).toBe(STARTING_BALANCE + 300);

    await act(async () => {
      press(screen, testIds.coins.back);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/player/[seriesId]',
      params: { seriesId: 'the-ceo-and-i', episode: '4' },
    });
  });

  test('keeps the player and series details on the same unlocked episode', async () => {
    const storage = memoryStorage();
    const loadEpisode = (seriesId: string, episode: number, options?: PlayerRequestOptions) =>
      loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 });
    const loadSeries = (seriesId: string, options?: SeriesRequestOptions) =>
      loadSeriesDetails(seriesId, { ...options, delayMs: 0 });
    const screen = await renderTree(
      <WalletProvider storage={storage}>
        <PlayerScreen episodeParam="4" loadEpisode={loadEpisode} seriesId="the-ceo-and-i" />
      </WalletProvider>,
    );

    expect(textOf(screen)).toContain('15 coins');
    expect(textOf(screen)).toContain('Unlock Episode 4');

    await act(async () => {
      press(screen, testIds.player.unlock);
    });

    expect(textOf(screen)).toContain('Confirm to spend 10 coins');

    await act(async () => {
      press(screen, testIds.player.unlockConfirm);
      await Promise.resolve();
    });

    expect(textOf(screen)).toContain('5 coins');
    expect(textOf(screen)).toContain('Episode unlocked');
    expect(textOf(screen)).not.toContain('Unlock Episode 4');

    await act(async () => {
      screen.update(
        <SafeAreaProvider initialMetrics={metrics}>
          <WalletProvider storage={storage}>
            <SeriesDetailsScreen loadSeries={loadSeries} seriesId="the-ceo-and-i" />
          </WalletProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    expect(
      screen.root.findAll((node) => node.props.accessibilityLabel === 'Episode 4, unlocked').length,
    ).toBeGreaterThan(0);
    expect(textOf(screen)).toContain('Unlocked');
  });
});

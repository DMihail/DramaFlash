import { type ReactElement } from 'react';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { loadPlayerEpisode, type PlayerRequestOptions } from '@/api/player';
import { serializeSavedSeries, serializeViewingProgress } from '@/domain/library';
import { freshWallet, serializeWallet, unlockEpisode } from '@/domain/wallet';
import { HomeScreen } from '@/features/home/HomeScreen';
import { seriesDestination } from '@/features/home/model';
import { LibraryProvider } from '@/features/library/LibraryProvider';
import { LibraryScreen } from '@/features/library/LibraryScreen';
import { libraryEmptyBody, librarySaveFailedMessage } from '@/features/library/model';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { playerDestination } from '@/features/series/model';
import { WalletProvider } from '@/features/wallet/WalletProvider';
import {
  type LocalStorage,
  MMKV_LIBRARY_KEY,
  MMKV_PROGRESS_KEY,
  MMKV_WALLET_KEY,
} from '@/storage/persistence';
import { testIds } from '@/testing/testIds';

import { memoryLegacy, memoryLocal } from '../../support/storage';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
  push: jest.fn(),
  setParams: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockRouter.back(...args),
    canGoBack: () => mockRouter.canGoBack(),
    navigate: (...args: unknown[]) => mockRouter.navigate(...args),
    push: (...args: unknown[]) => mockRouter.push(...args),
    setParams: (...args: unknown[]) => mockRouter.setParams(...args),
  },
}));

jest.mock('lucide-react-native', () => {
  const Icon = () => null;
  return new Proxy({}, { get: () => Icon });
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const wallet = freshWallet();

function instantEpisode(seriesId: string, episode: number, options?: PlayerRequestOptions) {
  return loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 });
}

async function mount(ui: ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>,
    );
    for (let step = 0; step < 12; step += 1) {
      await Promise.resolve();
    }
  });

  if (!renderer) {
    throw new Error('expected a screen');
  }

  return renderer;
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const node = renderer.root.findAll((item) => item.props.testID === testID).at(-1);
  let current: TestRenderer.ReactTestInstance | null | undefined = node;
  while (current) {
    const onPress = current.props.onPress as (() => void) | undefined;
    if (typeof onPress === 'function') {
      onPress();
      return;
    }

    current = current.parent;
  }

  throw new Error(`No press handler for ${testID}`);
}

function libraryTree(local: LocalStorage, child: ReactElement) {
  return mount(<LibraryProvider local={local}>{child}</LibraryProvider>);
}

describe('library screen', () => {
  beforeEach(() => {
    mockRouter.navigate.mockClear();
    mockRouter.push.mockClear();
  });

  test('shows an empty library, then a saved series, and opens it', async () => {
    const local = memoryLocal();
    let renderer = await libraryTree(local, <LibraryScreen />);

    expect(textOf(renderer)).toContain(libraryEmptyBody);
    expect(
      renderer.root.findAll((node) => node.props.testID === testIds.library.empty).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      renderer.unmount();
    });

    renderer = await libraryTree(local, <HomeScreen />);

    await act(async () => {
      press(renderer, testIds.home.save);
      await Promise.resolve();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toContain('the-ceo-and-i');

    await act(async () => {
      press(renderer, testIds.home.save);
      await Promise.resolve();
    });

    const removed = local.snapshot(MMKV_LIBRARY_KEY);
    expect(removed).not.toContain('the-ceo-and-i');

    await act(async () => {
      press(renderer, testIds.home.save);
      await Promise.resolve();
      renderer.unmount();
    });

    renderer = await libraryTree(local, <LibraryScreen />);
    expect(textOf(renderer)).toContain('The CEO and I');
    expect(
      renderer.root.findAll((node) => node.props.testID === testIds.library.poster('the-ceo-and-i'))
        .length,
    ).toBeGreaterThan(0);

    await act(async () => {
      press(renderer, testIds.library.poster('the-ceo-and-i'));
    });

    expect(mockRouter.push).toHaveBeenCalledWith(seriesDestination('the-ceo-and-i'));
  });

  test('resumes the last free episode and skips a locked one', async () => {
    const local = memoryLocal({
      [MMKV_PROGRESS_KEY]: serializeViewingProgress([
        { seriesId: 'the-ceo-and-i', episode: 4, updatedAt: 30 },
        { seriesId: 'love-on-detours', episode: 2, updatedAt: 10 },
      ]),
    });
    let renderer = await libraryTree(local, <LibraryScreen />);

    expect(
      renderer.root.findAll(
        (node) => node.props.testID === testIds.library.resume('the-ceo-and-i'),
      ),
    ).toHaveLength(0);
    expect(textOf(renderer)).toContain('Love on Detours');

    await act(async () => {
      press(renderer, testIds.library.resume('love-on-detours'));
    });

    expect(mockRouter.push).toHaveBeenCalledWith(playerDestination('love-on-detours', 2, 65));
    await act(async () => {
      renderer.unmount();
    });

    const played = memoryLocal();
    renderer = await libraryTree(
      played,
      <PlayerScreen
        episodeParam="1"
        loadEpisode={instantEpisode}
        seriesId="shadow-kiss"
        wallet={wallet}
      />,
    );

    expect(played.snapshot(MMKV_PROGRESS_KEY)).toContain('"episode":1');
    expect(played.snapshot(MMKV_PROGRESS_KEY)).toContain('shadow-kiss');

    await act(async () => {
      renderer.unmount();
    });

    const locked = memoryLocal();
    renderer = await libraryTree(
      locked,
      <PlayerScreen
        episodeParam="4"
        loadEpisode={instantEpisode}
        seriesId="the-ceo-and-i"
        wallet={wallet}
      />,
    );
    expect(locked.snapshot(MMKV_PROGRESS_KEY)).toBeNull();
  });

  test('keeps a failed save off the screen and keeps a corrupt library unread', async () => {
    const failing: LocalStorage & { snapshot: (key?: string) => string | null } = {
      snapshot: () => null,
      getString: () => undefined,
      setString: () => {
        throw new Error('full');
      },
      delete: () => undefined,
    };
    let renderer = await libraryTree(failing, <HomeScreen />);

    await act(async () => {
      press(renderer, testIds.home.save);
      await Promise.resolve();
    });

    expect(textOf(renderer)).toContain(librarySaveFailedMessage);
    expect(
      renderer.root.findAll((node) => node.props.accessibilityLabel === 'Add to library').length,
    ).toBeGreaterThan(0);

    await act(async () => {
      renderer.unmount();
    });

    const corrupt = memoryLocal({ [MMKV_LIBRARY_KEY]: '{' });
    renderer = await libraryTree(corrupt, <LibraryScreen />);
    expect(
      renderer.root.findAll((node) => node.props.testID === testIds.library.error).length,
    ).toBeGreaterThan(0);
    expect(textOf(renderer)).not.toContain('The CEO and I');
    expect(corrupt.snapshot(MMKV_LIBRARY_KEY)).toBe('{');
  });

  test('shows an unlocked episode and ignores an unknown saved id', async () => {
    const unlocked = unlockEpisode(freshWallet(), 'the-ceo-and-i', 4);
    const local = memoryLocal({
      [MMKV_LIBRARY_KEY]: serializeSavedSeries(['missing-show', 'dark-desire']),
      [MMKV_PROGRESS_KEY]: serializeViewingProgress([
        { seriesId: 'the-ceo-and-i', episode: 4, updatedAt: 4 },
      ]),
      [MMKV_WALLET_KEY]: serializeWallet(unlocked),
    });

    const renderer = await mount(
      <WalletProvider legacy={memoryLegacy()} local={local}>
        <LibraryProvider local={local}>
          <LibraryScreen />
        </LibraryProvider>
      </WalletProvider>,
    );

    expect(textOf(renderer)).toContain('Dark Desire');
    expect(textOf(renderer)).not.toContain('missing-show');
    expect(
      renderer.root.findAll((node) => node.props.testID === testIds.library.resume('the-ceo-and-i'))
        .length,
    ).toBeGreaterThan(0);
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toContain('missing-show');
    expect(local.snapshot(MMKV_WALLET_KEY)).toContain('the-ceo-and-i');
  });

  test('keeps free continue watching when the wallet cannot be read', async () => {
    const local = memoryLocal({
      [MMKV_PROGRESS_KEY]: serializeViewingProgress([
        { seriesId: 'the-ceo-and-i', episode: 4, updatedAt: 30 },
        { seriesId: 'love-on-detours', episode: 2, updatedAt: 10 },
      ]),
      [MMKV_WALLET_KEY]: '{',
    });

    const renderer = await mount(
      <WalletProvider legacy={memoryLegacy()} local={local}>
        <LibraryProvider local={local}>
          <LibraryScreen />
        </LibraryProvider>
      </WalletProvider>,
    );

    expect(
      renderer.root.findAll((node) => node.props.testID === testIds.library.empty),
    ).toHaveLength(0);
    expect(textOf(renderer)).not.toContain(libraryEmptyBody);
    expect(
      renderer.root.findAll(
        (node) => node.props.testID === testIds.library.resume('love-on-detours'),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll(
        (node) => node.props.testID === testIds.library.resume('the-ceo-and-i'),
      ),
    ).toHaveLength(0);
    expect(textOf(renderer)).toContain('Love on Detours');
    expect(textOf(renderer)).not.toContain('The CEO and I');
  });
});

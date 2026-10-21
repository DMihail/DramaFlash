import { AccessibilityInfo, Animated } from 'react-native';

import { Heart } from 'lucide-react-native';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { GenreChip } from '@/components/GenreChip';
import { IconButton } from '@/components/IconButton';
import { PosterCard } from '@/components/PosterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { type WalletStorage } from '@/domain/wallet';
import { CoinStoreScreen } from '@/features/coins/CoinStoreScreen';
import { demoPurchaseNote } from '@/features/coins/model';
import { WalletProvider } from '@/features/wallet/WalletProvider';
import { Placeholder } from '@/navigation/placeholder';
import { testIds } from '@/testing/testIds';

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return new Proxy({ Heart: Icon }, { get: () => Icon });
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function hosts(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  return renderer.root.findAll((node) => {
    if (node.props.testID !== testID) {
      return false;
    }

    return node.findAll((child) => child !== node && child.props.testID === testID).length === 0;
  });
}

describe('shared test IDs', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('puts the test ID on the control and keeps the visible label', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <Screen safeArea="tabs" testID={testIds.home.screen}>
            <PrimaryButton label="Watch now" testID={testIds.home.watchNow} />
            <IconButton
              accessibilityLabel="Add to library"
              icon={Heart}
              testID={testIds.home.save}
            />
            <GenreChip
              label="Romance"
              onPress={() => undefined}
              testID={testIds.home.genre('Romance')}
            />
            <SectionHeader
              actionLabel="See all"
              onActionPress={() => undefined}
              testID={testIds.home.seeAll('trending-romance')}
              title="Trending Romance"
            />
            <PosterCard
              onPress={() => undefined}
              testID={testIds.home.poster('the-ceo-and-i')}
              title="The CEO and I"
            />
            <PosterCard testID={testIds.series.episode(2)} title="Band of Fate" />
            <Skeleton height={16} testID={testIds.player.loading} width={80} />
            <Placeholder safeArea="stack" testID={testIds.coins.store} title="Coin store" />
          </Screen>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    const watch = hosts(screen, testIds.home.watchNow)[0];
    const save = hosts(screen, testIds.home.save)[0];
    const genre = hosts(screen, testIds.home.genre('Romance'))[0];
    const seeAll = hosts(screen, testIds.home.seeAll('trending-romance'))[0];
    const poster = hosts(screen, testIds.home.poster('the-ceo-and-i'))[0];
    const staticPoster = hosts(screen, testIds.series.episode(2))[0];

    expect(hosts(screen, testIds.home.screen)).toHaveLength(1);
    expect(hosts(screen, testIds.coins.store)).toHaveLength(1);
    expect(hosts(screen, testIds.player.loading)).toHaveLength(1);
    expect(watch?.props.accessibilityLabel).toBe('Watch now');
    expect(watch?.props.accessibilityRole).toBe('button');
    expect(save?.props.accessibilityLabel).toBe('Add to library');
    expect(genre?.props.accessibilityLabel).toBe('Romance');
    expect(genre?.props.accessibilityState).toEqual({ selected: false });
    expect(seeAll?.props.accessibilityLabel).toBe('See all');
    expect(poster?.props.accessibilityLabel).toBe('The CEO and I');
    expect(poster?.props.accessibilityRole).toBe('button');
    expect(staticPoster?.props.accessibilityRole).toBeUndefined();
    expect(
      screen.root.findAll((node) => node.props.children === 'Coin store').length,
    ).toBeGreaterThan(0);
    expect(
      screen.root.findAll((node) => node.props.children === 'Trending Romance').length,
    ).toBeGreaterThan(0);

    await act(async () => {
      screen.unmount();
    });
  });

  test('coin store screen uses the store test ID', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    const storage: WalletStorage = {
      getItem: async () => null,
      setItem: async () => undefined,
      removeItem: async () => undefined,
    };

    await act(async () => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <WalletProvider storage={storage}>
            <CoinStoreScreen />
          </WalletProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected the coin store');
    }

    expect(hosts(screen, testIds.coins.store)).toHaveLength(1);
    expect(hosts(screen, testIds.coins.balance)).toHaveLength(1);
    expect(
      screen.root.findAll((node) => node.props.children === demoPurchaseNote).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      screen.unmount();
    });
  });
});

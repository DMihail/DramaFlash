import { AccessibilityInfo, Animated } from 'react-native';

import { Heart } from 'lucide-react-native';
import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import CoinStoreScreen from '@/app/coins';
import { GenreChip } from '@/components/GenreChip';
import { IconButton } from '@/components/IconButton';
import { PosterCard } from '@/components/PosterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Placeholder } from '@/navigation/placeholder';

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return { Heart: Icon };
});

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
          <Screen safeArea="tabs" testID="home.screen">
            <PrimaryButton label="Watch now" testID="home.watchNow" />
            <IconButton accessibilityLabel="Add to library" icon={Heart} testID="home.save" />
            <GenreChip label="Romance" onPress={() => undefined} testID="home.genre.romance" />
            <SectionHeader
              actionLabel="See all"
              onActionPress={() => undefined}
              testID="home.seeAll.trending-romance"
              title="Trending Romance"
            />
            <PosterCard
              onPress={() => undefined}
              testID="home.poster.the-ceo-and-i"
              title="The CEO and I"
            />
            <PosterCard testID="series.recommendation.band-of-fate" title="Band of Fate" />
            <Skeleton height={16} testID="player.loading" width={80} />
            <Placeholder safeArea="stack" testID="coins.store" title="Coin store" />
          </Screen>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    const watch = hosts(screen, 'home.watchNow')[0];
    const save = hosts(screen, 'home.save')[0];
    const genre = hosts(screen, 'home.genre.romance')[0];
    const seeAll = hosts(screen, 'home.seeAll.trending-romance')[0];
    const poster = hosts(screen, 'home.poster.the-ceo-and-i')[0];
    const staticPoster = hosts(screen, 'series.recommendation.band-of-fate')[0];

    expect(hosts(screen, 'home.screen')).toHaveLength(1);
    expect(hosts(screen, 'coins.store')).toHaveLength(1);
    expect(hosts(screen, 'player.loading')).toHaveLength(1);
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

    await act(async () => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <CoinStoreScreen />
        </SafeAreaProvider>,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected the coin store');
    }

    expect(hosts(screen, 'coins.store')).toHaveLength(1);
    expect(
      screen.root.findAll((node) => node.props.children === 'Coin store').length,
    ).toBeGreaterThan(0);

    await act(async () => {
      screen.unmount();
    });
  });
});

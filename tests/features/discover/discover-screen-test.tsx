import { type ReactElement } from 'react';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { type DiscoverLoader } from '@/api/discover';
import { MockRequestAborted } from '@/api/mockRequest';
import { catalog, type Series } from '@/data/catalog';
import { DiscoverScreen } from '@/features/discover/DiscoverScreen';
import { discoverSearchEmptyMessage } from '@/features/discover/model';
import { emptyCategoryMessage, seriesDestination } from '@/features/home/model';
import { testIds } from '@/testing/testIds';

const mockRouter = {
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouter.push(...args),
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

function loadNow(): DiscoverLoader {
  return () => Promise.resolve(catalog);
}

function renderScreen(ui: ReactElement) {
  return TestRenderer.create(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

function host(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const match = renderer.root.findAll((node) => node.props.testID === testID).at(-1);
  if (!match) {
    throw new Error(`No host for ${testID}`);
  }

  return match;
}

function changeSearch(renderer: TestRenderer.ReactTestRenderer, value: string) {
  const onChangeText: unknown = host(renderer, testIds.discover.search).props.onChangeText;
  if (typeof onChangeText !== 'function') {
    throw new Error('Search field has no change handler');
  }

  (onChangeText as (next: string) => void)(value);
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  let current: TestRenderer.ReactTestInstance | null = host(renderer, testID);
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

describe('discover screen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  test('shows the catalog, filters it, and opens a series', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = renderScreen(<DiscoverScreen category="Romance" loadCatalog={loadNow()} />);
    });
    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(host(screen, testIds.discover.screen)).toBeTruthy();
    expect(host(screen, testIds.discover.search).props.autoFocus).toBe(false);
    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).not.toContain('Avenging Angel');
    expect(host(screen, testIds.discover.genre('Romance')).props.accessibilityState).toEqual({
      selected: true,
    });

    await act(async () => {
      changeSearch(screen, '  SECRET ');
    });

    expect(textOf(screen)).toContain('My Secret Life');
    expect(textOf(screen)).not.toContain('Love on Detours');
    expect(textOf(screen)).toContain('Search results');

    await act(async () => {
      press(screen, testIds.discover.clear);
    });

    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).toContain('Stories you’ll love');

    await act(async () => {
      changeSearch(screen, 'zzzz');
    });

    expect(textOf(screen)).toContain(discoverSearchEmptyMessage);
    expect(
      screen.root.findAll(
        (node) => node.props.testID === testIds.discover.poster('love-on-detours'),
      ),
    ).toHaveLength(0);

    await act(async () => {
      press(screen, testIds.discover.genre('All'));
      changeSearch(screen, 'love');
    });

    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).toContain('Love in the Fast Lane');

    await act(async () => {
      press(screen, testIds.discover.genre('Romance'));
    });

    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).not.toContain('Love in the Fast Lane');

    await act(async () => {
      press(screen, testIds.discover.poster('love-on-detours'));
    });

    expect(mockRouter.push).toHaveBeenCalledWith(seriesDestination('love-on-detours'));
  });

  test('clears a leftover search when the route genre changes', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = renderScreen(<DiscoverScreen loadCatalog={loadNow()} />);
    });
    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    await act(async () => {
      changeSearch(screen, 'secret');
    });

    expect(textOf(screen)).toContain('My Secret Life');
    expect(textOf(screen)).not.toContain('Love on Detours');

    await act(async () => {
      screen.update(
        <SafeAreaProvider initialMetrics={metrics}>
          <DiscoverScreen category="Romance" loadCatalog={loadNow()} />
        </SafeAreaProvider>,
      );
    });

    expect(host(screen, testIds.discover.search).props.value).toBe('');
    expect(host(screen, testIds.discover.search).props.autoFocus).toBe(false);
    expect(host(screen, testIds.discover.genre('Romance')).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(textOf(screen)).toContain('Stories you’ll love');
    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).toContain('The CEO and I');
    expect(textOf(screen)).toContain('My Secret Life');
    expect(textOf(screen)).not.toContain('Avenging Angel');
    expect(textOf(screen)).not.toContain('Search results');
  });

  test('replaces an old category when Home opens search', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = renderScreen(<DiscoverScreen category="Romance" loadCatalog={loadNow()} />);
    });
    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    await act(async () => {
      changeSearch(screen, 'secret');
    });

    expect(textOf(screen)).not.toContain('Love on Detours');

    await act(async () => {
      screen.update(
        <SafeAreaProvider initialMetrics={metrics}>
          <DiscoverScreen loadCatalog={loadNow()} />
        </SafeAreaProvider>,
      );
    });

    expect(host(screen, testIds.discover.search).props.value).toBe('');
    expect(host(screen, testIds.discover.search).props.autoFocus).toBe(true);
    expect(host(screen, testIds.discover.genre('All')).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(textOf(screen)).toContain('Love on Detours');
    expect(textOf(screen)).toContain('Avenging Angel');
    expect(textOf(screen)).toContain('Stories you’ll love');
  });

  test('shows an empty genre, then loading, error, and retry', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = renderScreen(<DiscoverScreen category="Mystery" loadCatalog={loadNow()} />);
    });
    const mystery = renderer;
    if (!mystery) {
      throw new Error('expected a screen');
    }

    expect(textOf(mystery)).toContain(emptyCategoryMessage);
    expect(host(mystery, testIds.discover.empty)).toBeTruthy();

    let resolveLoad: ((series: readonly Series[]) => void) | undefined;
    const pending: DiscoverLoader = (options) =>
      new Promise((resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(new MockRequestAborted());
        });
        resolveLoad = resolve;
      });

    await act(async () => {
      renderer = renderScreen(<DiscoverScreen loadCatalog={pending} />);
    });
    const loading = renderer;
    if (!loading) {
      throw new Error('expected a loading screen');
    }

    expect(host(loading, testIds.discover.loading)).toBeTruthy();

    await act(async () => {
      loading.unmount();
      resolveLoad?.(catalog);
    });

    let attempts = 0;
    const flaky: DiscoverLoader = () => {
      attempts += 1;
      if (attempts === 1) {
        return Promise.reject(new Error('offline'));
      }

      return Promise.resolve(catalog);
    };

    await act(async () => {
      renderer = renderScreen(<DiscoverScreen loadCatalog={flaky} />);
      await Promise.resolve();
    });
    const failed = renderer;
    if (!failed) {
      throw new Error('expected an error screen');
    }

    expect(host(failed, testIds.discover.retry)).toBeTruthy();

    await act(async () => {
      press(failed, testIds.discover.retry);
      await Promise.resolve();
    });

    expect(textOf(failed)).toContain('The CEO and I');
  });
});

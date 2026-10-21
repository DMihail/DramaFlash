import { type ReactElement } from 'react';
import { Animated } from 'react-native';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import {
  loadSeriesDetails,
  type SeriesDetailsResult,
  type SeriesRequestOptions,
} from '@/api/series';
import { seriesErrorMessage } from '@/features/series/model';
import { SeriesDetailsScreen } from '@/features/series/SeriesDetailsScreen';

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return {
    ArrowUpDown: Icon,
    ChevronLeft: Icon,
    Heart: Icon,
    Lock: Icon,
    Play: Icon,
    Share2: Icon,
  };
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    push: jest.fn(),
  },
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen(ui: ReactElement) {
  return TestRenderer.create(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll(
      (node) => typeof node.children?.[0] === 'string' || typeof node.props.children === 'string',
    )
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

function isPressHandler(value: unknown): value is () => void {
  return typeof value === 'function';
}

function isRetryButton(node: TestRenderer.ReactTestInstance): boolean {
  return node.children.some((child) => child === 'Retry');
}

function readPress(node: TestRenderer.ReactTestInstance | undefined): (() => void) | null {
  let current = node;
  while (current) {
    const props = current.props as { onPress?: unknown };
    if (isPressHandler(props.onPress)) {
      return props.onPress;
    }

    current = current.parent ?? undefined;
  }

  return null;
}

function hasLabel(renderer: TestRenderer.ReactTestRenderer, label: string): boolean {
  return renderer.root.findAll((node) => node.props.accessibilityLabel === label).length > 0;
}

describe('series details screen', () => {
  beforeEach(() => {
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the loading skeleton while the request is open', async () => {
    const load = () => new Promise<SeriesDetailsResult>(() => undefined);
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(<SeriesDetailsScreen loadSeries={load} seriesId="the-ceo-and-i" />);
    });

    expect(renderer).toBeDefined();
    expect(hasLabel(renderer as TestRenderer.ReactTestRenderer, 'Loading series')).toBe(true);
    expect(textOf(renderer as TestRenderer.ReactTestRenderer)).not.toContain('The CEO and I');
  });

  test('shows an error, then the series after retry', async () => {
    let calls = 0;
    const load = (seriesId: string, options?: SeriesRequestOptions) => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new Error('The series could not be loaded.'));
      }

      return loadSeriesDetails(seriesId, {
        delayMs: 0,
        ...(options?.signal ? { signal: options.signal } : {}),
      });
    };
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(<SeriesDetailsScreen loadSeries={load} seriesId="the-ceo-and-i" />);
    });

    const screen = renderer as TestRenderer.ReactTestRenderer;
    expect(textOf(screen)).toContain(seriesErrorMessage);

    const onRetry = readPress(screen.root.findAll((node) => isRetryButton(node))[0]);
    if (!onRetry) {
      throw new Error('Retry has no press handler');
    }

    await act(async () => {
      onRetry();
    });

    expect(textOf(screen)).toContain('The CEO and I');
    expect(textOf(screen)).toContain('50 episodes');
    expect(hasLabel(screen, 'Episode 1, free')).toBe(true);
    expect(hasLabel(screen, 'Episode 4, locked, 10 coins')).toBe(true);
  });
});

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
import { testIds } from '@/testing/testIds';

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return {
    ArrowUpDown: Icon,
    ChevronLeft: Icon,
    Heart: Icon,
    Lock: Icon,
    LockKeyhole: Icon,
    Play: Icon,
    Share2: Icon,
  };
});

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockRouter.back(...args),
    canGoBack: () => mockRouter.canGoBack(),
    navigate: (...args: unknown[]) => mockRouter.navigate(...args),
    push: (...args: unknown[]) => mockRouter.push(...args),
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

function hasTestId(renderer: TestRenderer.ReactTestRenderer, testID: string): boolean {
  return renderer.root.findAll((node) => node.props.testID === testID).length > 0;
}

function nodeTestId(node: TestRenderer.ReactTestInstance): string | null {
  const props = node.props as { testID?: unknown };
  return typeof props.testID === 'string' ? props.testID : null;
}

function ownedTestIds(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll((node) => {
      const testID = nodeTestId(node);
      if (testID === null) {
        return false;
      }

      return node.findAll((child) => child !== node && nodeTestId(child) === testID).length === 0;
    })
    .map((node) => nodeTestId(node) ?? '');
}

function pressTestId(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const match = renderer.root.findAll((node) => node.props.testID === testID).at(0);
  const press = readPress(match);
  if (!press) {
    throw new Error(`No press handler for ${testID}`);
  }

  return press;
}

describe('series details screen', () => {
  beforeEach(() => {
    mockRouter.back.mockClear();
    mockRouter.push.mockClear();
    mockRouter.canGoBack.mockReturnValue(true);
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
    const screen = renderer as TestRenderer.ReactTestRenderer;
    expect(hasLabel(screen, 'Loading series')).toBe(true);
    expect(hasTestId(screen, testIds.series.loading)).toBe(true);
    expect(hasTestId(screen, testIds.series.screen)).toBe(false);
    expect(textOf(screen)).not.toContain('The CEO and I');
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
    expect(hasTestId(screen, testIds.series.retry)).toBe(true);
    expect(hasTestId(screen, testIds.series.screen)).toBe(false);
    expect(hasLabel(screen, 'Go back')).toBe(true);

    const onRetry = readPress(screen.root.findAll((node) => isRetryButton(node))[0]);
    if (!onRetry) {
      throw new Error('Retry has no press handler');
    }

    await act(async () => {
      onRetry();
    });

    expect(textOf(screen)).toContain('The CEO and I');
    expect(textOf(screen)).toContain('50 episodes');
    expect(hasTestId(screen, testIds.series.screen)).toBe(true);
    expect(hasTestId(screen, testIds.series.title)).toBe(true);
    expect(hasTestId(screen, testIds.series.loading)).toBe(false);
    expect(hasTestId(screen, testIds.series.retry)).toBe(false);
    expect(hasTestId(screen, testIds.series.episode(1))).toBe(true);
    expect(hasTestId(screen, testIds.series.episode(4))).toBe(true);
    expect(hasLabel(screen, 'Episode 1, free')).toBe(true);
    expect(hasLabel(screen, 'Episode 4, locked, 10 coins')).toBe(true);
    expect(new Set(ownedTestIds(screen)).size).toBe(ownedTestIds(screen).length);

    await act(async () => {
      pressTestId(screen, testIds.series.episode(4))();
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/player/[seriesId]',
      params: { seriesId: 'the-ceo-and-i', episode: '4' },
    });
  });
});

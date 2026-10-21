import { type ReactElement } from 'react';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { HomeScreen } from '@/features/home/HomeScreen';
import { emptyCategoryMessage } from '@/features/home/model';

const mockRouter = {
  navigate: jest.fn(),
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    navigate: (...args: unknown[]) => mockRouter.navigate(...args),
    push: (...args: unknown[]) => mockRouter.push(...args),
  },
}));

jest.mock('lucide-react-native', () => {
  const Icon = () => null;

  return {
    Bell: Icon,
    Heart: Icon,
    Play: Icon,
    Plus: Icon,
    Search: Icon,
  };
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const seriesRoute = {
  pathname: '/series/[seriesId]',
  params: { seriesId: 'the-ceo-and-i' },
};

function renderScreen(ui: ReactElement) {
  return TestRenderer.create(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

function isPressHandler(value: unknown): value is () => void {
  return typeof value === 'function';
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

function hasTestId(renderer: TestRenderer.ReactTestRenderer, testID: string): boolean {
  return renderer.root.findAll((node) => node.props.testID === testID).length > 0;
}

function nodeTestId(node: TestRenderer.ReactTestInstance): string | null {
  const props = node.props as { testID?: unknown };
  return typeof props.testID === 'string' ? props.testID : null;
}

function isTestIdHost(node: TestRenderer.ReactTestInstance, testID: string): boolean {
  return node.findAll((child) => child !== node && nodeTestId(child) === testID).length === 0;
}

function ownedTestIds(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAll((node) => {
      const testID = nodeTestId(node);
      return testID !== null && isTestIdHost(node, testID);
    })
    .map((node) => nodeTestId(node) ?? '');
}

function host(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const match = renderer.root
    .findAll((node) => nodeTestId(node) === testID && isTestIdHost(node, testID))
    .at(0);

  if (!match) {
    throw new Error(`No host for ${testID}`);
  }

  return match;
}

function pressTestId(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const press = readPress(host(renderer, testID));
  if (!press) {
    throw new Error(`No press handler for ${testID}`);
  }

  return press;
}

describe('home screen', () => {
  beforeEach(() => {
    mockRouter.navigate.mockClear();
    mockRouter.push.mockClear();
  });

  test('opens a known series from the poster and from Watch now', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(<HomeScreen />);
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    const ids = ownedTestIds(screen);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
    expect(hasTestId(screen, 'home.screen')).toBe(true);
    expect(hasTestId(screen, 'home.watchNow')).toBe(true);
    expect(hasTestId(screen, 'home.poster.the-ceo-and-i')).toBe(true);
    expect(hasTestId(screen, 'home.genre.romance')).toBe(true);
    expect(hasTestId(screen, 'home.seeAll.trending-romance')).toBe(true);
    expect(hasTestId(screen, 'home.search')).toBe(true);

    const poster = host(screen, 'home.poster.the-ceo-and-i');
    const watch = host(screen, 'home.watchNow');
    const romance = host(screen, 'home.genre.romance');
    expect(poster.props.accessibilityLabel).toBe('The CEO and I');
    expect(watch.props.accessibilityLabel).toBe('Watch now');
    expect(romance.props.accessibilityLabel).toBe('Romance');

    await act(async () => {
      pressTestId(screen, 'home.watchNow')();
    });

    expect(mockRouter.push).toHaveBeenCalledWith(seriesRoute);

    await act(async () => {
      pressTestId(screen, 'home.poster.the-ceo-and-i')();
    });

    expect(mockRouter.push).toHaveBeenCalledTimes(2);
    expect(mockRouter.push).toHaveBeenLastCalledWith(seriesRoute);

    await act(async () => {
      pressTestId(screen, 'home.genre.mystery')();
    });

    expect(textOf(screen)).toContain(emptyCategoryMessage);
    expect(hasTestId(screen, 'home.poster.the-ceo-and-i')).toBe(false);
    expect(hasTestId(screen, 'home.screen')).toBe(true);
  });
});

import { type ReactElement } from 'react';
import { Animated } from 'react-native';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { MockRequestAborted } from '@/api/mockRequest';
import {
  loadPlayerEpisode,
  type PlayerEpisodeResult,
  type PlayerRequestOptions,
} from '@/api/player';
import { freshWallet, unlockEpisode } from '@/domain/wallet';
import { playerErrorMessage, unavailableMediaMessage } from '@/features/player/model';
import { PlayerScreen } from '@/features/player/PlayerScreen';

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

  return {
    ChevronLeft: Icon,
    ChevronRight: Icon,
    Heart: Icon,
    ListVideo: Icon,
    Lock: Icon,
    MessageCircle: Icon,
    Pause: Icon,
    Play: Icon,
    Share2: Icon,
  };
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
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

function isDisabled(renderer: TestRenderer.ReactTestRenderer, label: string): boolean {
  return renderer.root
    .findAll((node) => node.props.accessibilityLabel === label)
    .some((node) => {
      const props = node.props as {
        disabled?: boolean;
        accessibilityState?: { disabled?: boolean };
      };
      return props.disabled === true || props.accessibilityState?.disabled === true;
    });
}

function hasLabel(renderer: TestRenderer.ReactTestRenderer, label: string): boolean {
  return renderer.root.findAll((node) => node.props.accessibilityLabel === label).length > 0;
}

function pressBy(
  renderer: TestRenderer.ReactTestRenderer,
  label: string,
  field: 'accessibilityLabel' | 'text',
) {
  const match = renderer.root
    .findAll((node) => {
      if (field === 'accessibilityLabel') {
        return node.props.accessibilityLabel === label;
      }

      return node.props.children === label;
    })
    .at(0);
  const press = readPress(match);
  if (!press) {
    throw new Error(`No press handler for ${label}`);
  }

  return press;
}

describe('player screen', () => {
  beforeEach(() => {
    mockRouter.back.mockClear();
    mockRouter.push.mockClear();
    mockRouter.setParams.mockClear();
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

  test('shows a loading skeleton, then the free episode artwork preview', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen
          episodeParam="1"
          loadEpisode={(seriesId, episode, options) =>
            loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 })
          }
          seriesId="the-ceo-and-i"
        />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(textOf(screen)).toContain('The CEO and I');
    expect(textOf(screen)).not.toContain('Playing artwork preview');
    expect(textOf(screen)).toContain('Paused artwork preview');
    expect(textOf(screen)).toContain('No video is playing.');

    await act(async () => {
      pressBy(screen, 'Watch', 'text')();
    });

    expect(textOf(screen)).toContain('Playing artwork preview');
    expect(textOf(screen)).toContain('Pause');
  });

  test('moves between episodes and stops at the first and last', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    const load = (seriesId: string, episode: number, options?: PlayerRequestOptions) =>
      loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 });

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen episodeParam="1" loadEpisode={load} seriesId="band-of-fate" />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(isDisabled(screen, 'Previous episode')).toBe(true);

    await act(async () => {
      pressBy(screen, 'Next episode 2', 'accessibilityLabel')();
    });

    expect(mockRouter.setParams).toHaveBeenCalledWith({ episode: '2' });

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen episodeParam="25" loadEpisode={load} seriesId="band-of-fate" />,
      );
    });

    const last = renderer;
    if (!last) {
      throw new Error('expected the last episode');
    }

    expect(textOf(last)).toContain('Episode 25 is locked');
    expect(isDisabled(last, 'Next episode')).toBe(true);
    expect(mockRouter.setParams).toHaveBeenCalledTimes(1);
  });

  test('shows a locked episode and opens the coin store without charging', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    const wallet = freshWallet();

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen
          episodeParam="4"
          loadEpisode={(seriesId, episode, options) =>
            loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 })
          }
          seriesId="the-ceo-and-i"
          wallet={wallet}
        />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(textOf(screen)).toContain('Unlock Episode 4');
    expect(textOf(screen)).toContain('does not charge coins');
    expect(textOf(screen)).not.toContain('Watch');
    expect(wallet.balance).toBe(15);
    expect(wallet.unlocks).toEqual([]);

    await act(async () => {
      pressBy(screen, 'Unlock', 'text')();
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/coins',
      params: { seriesId: 'the-ceo-and-i', episode: '4' },
    });
    expect(wallet.balance).toBe(15);
  });

  test('plays an episode that the wallet already unlocked', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen
          episodeParam="4"
          loadEpisode={(seriesId, episode, options) =>
            loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0 })
          }
          seriesId="the-ceo-and-i"
          wallet={unlockEpisode(freshWallet(), 'the-ceo-and-i', 4)}
        />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(textOf(screen)).toContain('Paused artwork preview');
    expect(textOf(screen)).not.toContain('Unlock Episode 4');
  });

  test('shows an error, then the episode after retry', async () => {
    let fail = true;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    const load = (seriesId: string, episode: number, options?: PlayerRequestOptions) =>
      loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0, fail });

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen episodeParam="2" loadEpisode={load} seriesId="my-secret-life" />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(textOf(screen)).toContain(playerErrorMessage);
    fail = false;

    await act(async () => {
      pressBy(screen, 'Retry', 'text')();
    });

    expect(textOf(screen)).toContain('My Secret Life');
    expect(textOf(screen)).toContain('Paused artwork preview');
  });

  test('ignores a slow result after the episode changes', async () => {
    const pending = new Map<number, (result: PlayerEpisodeResult) => void>();
    const load = (seriesId: string, episode: number) =>
      new Promise<PlayerEpisodeResult>((resolve) => {
        pending.set(episode, resolve);
      });
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen episodeParam="1" loadEpisode={load} seriesId="the-ceo-and-i" />,
      );
    });

    expect(hasLabel(renderer!, 'Loading episode')).toBe(true);

    await act(async () => {
      renderer?.update(
        <SafeAreaProvider initialMetrics={metrics}>
          <PlayerScreen episodeParam="2" loadEpisode={load} seriesId="the-ceo-and-i" />
        </SafeAreaProvider>,
      );
    });

    const episodeTwo = pending.get(2);
    const episodeOne = pending.get(1);
    if (!episodeTwo || !episodeOne) {
      throw new Error('expected both requests');
    }

    const secret = {
      id: 'the-ceo-and-i',
      title: 'The CEO and I',
      episodeCount: 50,
    };

    await act(async () => {
      episodeTwo({
        status: 'success',
        data: { series: secret, episode: 2, media: 'artwork' },
      });
    });

    expect(textOf(renderer!)).toContain('Paused artwork preview');

    await act(async () => {
      episodeOne({
        status: 'success',
        data: { series: { ...secret, title: 'Stale episode' }, episode: 1, media: 'artwork' },
      });
    });

    expect(textOf(renderer!)).toContain('The CEO and I');
    expect(textOf(renderer!)).not.toContain('Stale episode');
  });

  test('explains when the preview has no video', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen
          episodeParam="1"
          loadEpisode={(seriesId, episode, options) =>
            loadPlayerEpisode(seriesId, episode, { ...options, delayMs: 0, media: 'unavailable' })
          }
          seriesId="the-ceo-and-i"
        />,
      );
    });

    const screen = renderer;
    if (!screen) {
      throw new Error('expected a screen');
    }

    expect(textOf(screen)).toContain(unavailableMediaMessage);
    expect(textOf(screen)).not.toContain('Watch');
    expect(textOf(screen)).not.toContain('Playing artwork preview');
  });

  test('drops a cancelled request', async () => {
    const load = (_seriesId: string, _episode: number, options?: PlayerRequestOptions) => {
      options?.signal?.addEventListener('abort', () => undefined);
      return Promise.reject(new MockRequestAborted());
    };
    let renderer: TestRenderer.ReactTestRenderer | undefined;

    await act(async () => {
      renderer = renderScreen(
        <PlayerScreen episodeParam="1" loadEpisode={load} seriesId="the-ceo-and-i" />,
      );
    });

    expect(hasLabel(renderer!, 'Loading episode')).toBe(true);
    expect(textOf(renderer!)).not.toContain(playerErrorMessage);

    await act(async () => {
      renderer?.unmount();
    });
  });
});

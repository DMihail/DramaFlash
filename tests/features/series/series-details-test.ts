import { loadSeriesDetails } from '@/api/series';
import { freshWallet, STARTING_BALANCE } from '@/domain/wallet';
import { posterArt } from '@/features/home/assets';
import {
  continueEpisode,
  continueMessage,
  detailsPanel,
  episodeAccess,
  episodeListCanToggle,
  playerDestination,
  recommendationDestination,
  seriesLoginDestination,
  seriesSaveRequest,
  sharePayload,
  shouldApplySeriesResult,
  visibleEpisodes,
} from '@/features/series/model';
import { clearLoginTicket, holdLoginTicket, readLoginTicket } from '@/navigation/pendingLogin';

const numbered = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ number: index + 1 }));

describe('series details', () => {
  afterEach(() => {
    clearLoginTicket();
  });

  test('shows the selected series and hides story text that is not in the catalog', async () => {
    const angel = await loadSeriesDetails('avenging-angel', { delayMs: 0 });
    const roses = await loadSeriesDetails('bloody-roses', { delayMs: 0 });

    expect(angel).toMatchObject({
      status: 'success',
      data: {
        series: { id: 'avenging-angel', title: 'Avenging Angel', episodeCount: 90 },
        episodeStatus: 'success',
      },
    });
    expect(roses).toMatchObject({
      status: 'success',
      data: { series: { title: 'Bloody Roses', episodeCount: 80 } },
    });

    if (angel.status !== 'success' || roses.status !== 'success') {
      throw new Error('expected both series to load');
    }

    expect(angel.data.episodes).toHaveLength(90);
    expect(angel.data.episodes.every((episode) => !('title' in episode))).toBe(true);
    expect(angel.data).not.toHaveProperty('synopsis');
    expect(angel.data).not.toHaveProperty('cast');
    expect(angel.data.series.title).not.toBe(roses.data.series.title);
  });

  test('sorts episodes and limits the first page to six', () => {
    const episodes = numbered(8);

    expect(visibleEpisodes(episodes, 'asc', false).map((episode) => episode.number)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(visibleEpisodes(episodes, 'desc', false).map((episode) => episode.number)).toEqual([
      8, 7, 6, 5, 4, 3,
    ]);
    expect(visibleEpisodes(episodes, 'desc', true).map((episode) => episode.number)).toEqual([
      8, 7, 6, 5, 4, 3, 2, 1,
    ]);
    expect(episodeListCanToggle(6)).toBe(false);
    expect(episodeListCanToggle(7)).toBe(true);
    expect(episodes.map((episode) => episode.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('opens only episodes that belong to the selected series', () => {
    expect(playerDestination('the-ceo-and-i', 4, 50)).toEqual({
      pathname: '/player/[seriesId]',
      params: { seriesId: 'the-ceo-and-i', episode: '4' },
    });
    expect(playerDestination('my-secret-life', 30, 30)).toEqual({
      pathname: '/player/[seriesId]',
      params: { seriesId: 'my-secret-life', episode: '30' },
    });
    expect(playerDestination('the-ceo-and-i', 0, 50)).toBeNull();
    expect(playerDestination('the-ceo-and-i', 51, 50)).toBeNull();
    expect(playerDestination('my-secret-life', 31, 30)).toBeNull();
  });

  test('marks the first three episodes free and later episodes locked', () => {
    const wallet = freshWallet();
    const unlocked = {
      balance: STARTING_BALANCE,
      unlocks: [{ seriesId: 'the-ceo-and-i', episode: 4 }],
    };

    expect(episodeAccess(wallet, 'the-ceo-and-i', 1, 50)).toBe('free');
    expect(episodeAccess(wallet, 'the-ceo-and-i', 3, 50)).toBe('free');
    expect(episodeAccess(wallet, 'the-ceo-and-i', 4, 50)).toBe('locked');
    expect(episodeAccess(wallet, 'the-ceo-and-i', 51, 50)).toBe('invalid');
    expect(episodeAccess(unlocked, 'the-ceo-and-i', 4, 50)).toBe('unlocked');
    expect(episodeAccess(unlocked, 'the-ceo-and-i', 5, 50)).toBe('locked');
    expect(wallet).toEqual({ balance: STARTING_BALANCE, unlocks: [] });
    expect(continueEpisode(wallet, 'the-ceo-and-i', 50)).toBe(4);
    expect(continueEpisode(unlocked, 'the-ceo-and-i', 50)).toBe(5);
    expect(continueEpisode(wallet, 'the-ceo-and-i', 3)).toBeNull();
    expect(continueEpisode(wallet, 'the-ceo-and-i', null)).toBeNull();
    expect(continueMessage(4)).toContain('10 coins');
    expect(continueMessage(4)).toContain('does not charge coins');
  });

  test('chooses the skeleton, error, and series panels', () => {
    expect(detailsPanel({ status: 'loading' })).toBe('skeleton');
    expect(detailsPanel({ status: 'error' })).toBe('error');
    expect(detailsPanel({ status: 'not-found' })).toBe('not-found');
    expect(
      detailsPanel({
        status: 'success',
        data: {
          series: { id: 'draft', title: 'Draft', episodeCount: null },
          episodes: [],
          episodeStatus: 'empty',
          recommendations: [],
          recommendationStatus: 'empty',
        },
      }),
    ).toBe('series');
  });

  test('ignores a stale or aborted series response', () => {
    const request = { seriesId: 'the-ceo-and-i', attempt: 1 };

    expect(shouldApplySeriesResult(request, request, false)).toBe(true);
    expect(shouldApplySeriesResult(request, { seriesId: 'bloody-roses', attempt: 1 }, false)).toBe(
      false,
    );
    expect(shouldApplySeriesResult(request, { seriesId: 'the-ceo-and-i', attempt: 2 }, false)).toBe(
      false,
    );
    expect(shouldApplySeriesResult(request, request, true)).toBe(false);
  });

  test('sends a guest to login and keeps the series id', () => {
    const result = seriesSaveRequest('love-on-detours');

    expect(result).toMatchObject({
      type: 'login',
      ticket: { seriesIdToSave: 'love-on-detours' },
    });
    if (result.type !== 'login') {
      throw new Error('expected a login ticket');
    }

    holdLoginTicket(result.ticket);
    expect(readLoginTicket()?.seriesIdToSave).toBe('love-on-detours');
    expect(seriesLoginDestination()).toBe('/login');
    expect(result).not.toMatchObject({ type: 'saved' });
  });

  test('shares the title without claiming a link was copied', () => {
    expect(sharePayload('Shadow Kiss')).toEqual({ message: 'Shadow Kiss' });
    expect(JSON.stringify(sharePayload('Shadow Kiss')).toLowerCase()).not.toContain('copied');
  });

  test('sends each recommendation to its own series', () => {
    expect(recommendationDestination('forbidden-vows')).toEqual({
      pathname: '/series/[seriesId]',
      params: { seriesId: 'forbidden-vows' },
    });
    expect(recommendationDestination('love-in-the-fast-lane')).not.toEqual(
      recommendationDestination('the-heirs-dilemma'),
    );
    expect(posterArt('forbidden-vows')).toBeTruthy();
    expect(posterArt('love-in-the-fast-lane')).toBeTruthy();
    expect(posterArt('the-heirs-dilemma')).toBeTruthy();
  });
});

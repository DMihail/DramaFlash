import { MockRequestAborted, MockRequestFailed } from '@/api/mockRequest';
import {
  buildEpisodeList,
  fetchRecommendedSeries,
  fetchSeriesById,
  fetchSeriesEpisodes,
  loadSeriesDetails,
  type SeriesLookup,
} from '@/api/series';
import { findSeries } from '@/data/catalog';

const immediate = { delayMs: 0 } as const;

const draftLookup: SeriesLookup = (seriesId) => {
  if (seriesId === 'draft') {
    return { id: 'draft', title: 'Draft', episodeCount: null };
  }

  return undefined;
};

describe('series mock API', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns the selected series, its episode count, and no other series story', async () => {
    const ceo = await loadSeriesDetails('the-ceo-and-i', immediate);
    const secret = await loadSeriesDetails('my-secret-life', immediate);

    expect(ceo).toMatchObject({
      status: 'success',
      data: {
        series: { id: 'the-ceo-and-i', title: 'The CEO and I', episodeCount: 50 },
        episodeStatus: 'success',
      },
    });
    expect(secret).toMatchObject({
      status: 'success',
      data: {
        series: { id: 'my-secret-life', title: 'My Secret Life', episodeCount: 30 },
      },
    });

    if (ceo.status !== 'success' || secret.status !== 'success') {
      throw new Error('expected both series to load');
    }

    expect(ceo.data.episodes).toHaveLength(50);
    expect(ceo.data.episodes[0]).toEqual({ number: 1 });
    expect(ceo.data.episodes[49]).toEqual({ number: 50 });
    expect(secret.data.episodes).toHaveLength(30);
    expect(JSON.stringify(ceo.data)).not.toContain("The CEO's Secret Life");
    expect(JSON.stringify(ceo.data)).not.toContain('Elena');
    expect(ceo.data).not.toHaveProperty('synopsis');
    expect(ceo.data).not.toHaveProperty('cast');
    expect(ceo.data.series.title).not.toBe(secret.data.series.title);
  });

  test('returns not-found for an unknown series id', async () => {
    await expect(fetchSeriesById('missing-series', immediate)).resolves.toEqual({
      status: 'not-found',
    });
    await expect(fetchSeriesEpisodes('missing-series', immediate)).resolves.toEqual({
      status: 'not-found',
    });
    await expect(loadSeriesDetails('missing-series', immediate)).resolves.toEqual({
      status: 'not-found',
    });
  });

  test('returns an empty episode list when the count is missing', async () => {
    expect(buildEpisodeList(null)).toEqual({ status: 'empty' });
    await expect(
      fetchSeriesEpisodes('draft', { ...immediate, lookup: draftLookup }),
    ).resolves.toEqual({ status: 'empty' });

    const details = await loadSeriesDetails('draft', { ...immediate, lookup: draftLookup });
    expect(details).toMatchObject({
      status: 'success',
      data: { episodeStatus: 'empty', episodes: [], recommendationStatus: 'empty' },
    });
  });

  test('can fail and then succeed on a later request', async () => {
    await expect(
      loadSeriesDetails('shadow-kiss', { ...immediate, fail: true }),
    ).rejects.toBeInstanceOf(MockRequestFailed);

    const retry = await loadSeriesDetails('shadow-kiss', immediate);
    expect(retry).toMatchObject({
      status: 'success',
      data: { series: { id: 'shadow-kiss', title: 'Shadow Kiss', episodeCount: 45 } },
    });
  });

  test('rejects when the request is aborted', async () => {
    const controller = new AbortController();
    const pending = loadSeriesDetails('bloody-roses', { delayMs: 1000, signal: controller.signal });
    const rejected = expect(pending).rejects.toBeInstanceOf(MockRequestAborted);

    controller.abort();
    await rejected;
  });

  test('waits for the configured delay', async () => {
    jest.useFakeTimers();
    const pending = fetchSeriesById('band-of-fate', { delayMs: 250 });
    let resolved = false;
    const done = pending.then((result) => {
      resolved = true;
      return result;
    });

    await jest.advanceTimersByTimeAsync(249);
    expect(resolved).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await expect(done).resolves.toEqual({
      status: 'success',
      series: findSeries('band-of-fate'),
    });
  });

  test('recommends the approved catalog series and skips the open series', async () => {
    const details = await loadSeriesDetails('the-ceo-and-i', immediate);
    if (details.status !== 'success') {
      throw new Error('expected the series to load');
    }

    expect(details.data.recommendations.map((series) => series.id)).toEqual([
      'forbidden-vows',
      'love-in-the-fast-lane',
      'the-heirs-dilemma',
    ]);
    expect(details.data.recommendations.map((series) => series.episodeCount)).toEqual([48, 60, 45]);

    const vows = await fetchRecommendedSeries('forbidden-vows', immediate);
    expect(vows).toMatchObject({ status: 'success' });
    if (vows.status !== 'success') {
      throw new Error('expected recommendations');
    }

    expect(vows.series.map((series) => series.id)).toEqual([
      'love-in-the-fast-lane',
      'the-heirs-dilemma',
    ]);
    expect(vows.series.map((series) => series.id)).not.toContain('forbidden-vows');
  });
});

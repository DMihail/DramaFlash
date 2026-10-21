import { findSeries } from '@/data/catalog';
import {
  continueWatchingEntries,
  loadSavedSeries,
  loadViewingProgress,
  recordOpenedEpisode,
  serializeSavedSeries,
  serializeViewingProgress,
  toggleSeriesId,
  visibleSavedIds,
} from '@/domain/library';
import { freshWallet, unlockEpisode } from '@/domain/wallet';

describe('saved series', () => {
  test('starts empty when nothing is stored and keeps insertion order', () => {
    expect(loadSavedSeries(undefined)).toEqual({ status: 'empty' });

    const saved = toggleSeriesId(toggleSeriesId([], 'shadow-kiss'), 'the-ceo-and-i');
    const again = toggleSeriesId(saved, 'shadow-kiss');

    expect(saved).toEqual(['shadow-kiss', 'the-ceo-and-i']);
    expect(again).toEqual(['the-ceo-and-i']);
    expect(loadSavedSeries(serializeSavedSeries(saved))).toEqual({
      status: 'ready',
      savedSeriesIds: saved,
    });
  });

  test('hides unknown ids without dropping them from a valid record', () => {
    const loaded = loadSavedSeries(
      JSON.stringify({
        version: 1,
        savedSeriesIds: ['missing-show', 'love-on-detours', 'love-on-detours'],
      }),
    );

    expect(loaded).toEqual({
      status: 'ready',
      savedSeriesIds: ['missing-show', 'love-on-detours'],
    });
    if (loaded.status !== 'ready') {
      throw new Error('expected a saved list');
    }

    expect(visibleSavedIds(loaded.savedSeriesIds)).toEqual(['love-on-detours']);
    expect(findSeries('missing-show')).toBeUndefined();
  });

  test('rejects a broken saved record', () => {
    expect(loadSavedSeries('')).toEqual({ status: 'corrupt' });
    expect(loadSavedSeries('{')).toEqual({ status: 'corrupt' });
    expect(loadSavedSeries(JSON.stringify({ version: 2, savedSeriesIds: [] }))).toEqual({
      status: 'corrupt',
    });
    expect(loadSavedSeries(JSON.stringify({ version: 1, savedSeriesIds: [''] }))).toEqual({
      status: 'corrupt',
    });
  });
});

describe('viewing progress', () => {
  const wallet = freshWallet();

  test('records a free episode and ignores a locked or impossible one', () => {
    const opened = recordOpenedEpisode([], 'the-ceo-and-i', 1, 10, wallet);

    expect(opened).toEqual([{ seriesId: 'the-ceo-and-i', episode: 1, updatedAt: 10 }]);
    expect(recordOpenedEpisode([], 'the-ceo-and-i', 4, 10, wallet)).toBeNull();
    expect(recordOpenedEpisode([], 'the-ceo-and-i', 51, 10, wallet)).toBeNull();
    expect(recordOpenedEpisode([], 'band-of-fate', 26, 10, wallet)).toBeNull();
    expect(
      recordOpenedEpisode([], 'the-ceo-and-i', 4, 11, unlockEpisode(wallet, 'the-ceo-and-i', 4)),
    ).toEqual([{ seriesId: 'the-ceo-and-i', episode: 4, updatedAt: 11 }]);
  });

  test('keeps one episode per series and orders continue watching by time', () => {
    const first = recordOpenedEpisode([], 'love-on-detours', 2, 10, wallet);
    const second = recordOpenedEpisode(first ?? [], 'shadow-kiss', 3, 20, wallet);
    const replaced = recordOpenedEpisode(second ?? [], 'love-on-detours', 1, 30, wallet);

    expect(replaced).toEqual([
      { seriesId: 'shadow-kiss', episode: 3, updatedAt: 20 },
      { seriesId: 'love-on-detours', episode: 1, updatedAt: 30 },
    ]);
    expect(continueWatchingEntries(replaced ?? [], wallet).map((entry) => entry.seriesId)).toEqual([
      'love-on-detours',
      'shadow-kiss',
    ]);
    expect(
      continueWatchingEntries(
        [
          { seriesId: 'the-ceo-and-i', episode: 4, updatedAt: 50 },
          { seriesId: 'missing-show', episode: 1, updatedAt: 60 },
          { seriesId: 'dark-desire', episode: 1, updatedAt: 40 },
        ],
        wallet,
      ).map((entry) => entry.seriesId),
    ).toEqual(['dark-desire']);
  });

  test('rejects broken progress and keeps the newest duplicate', () => {
    expect(loadViewingProgress(undefined)).toEqual({ status: 'empty' });
    expect(loadViewingProgress('{')).toEqual({ status: 'corrupt' });
    expect(
      loadViewingProgress(
        JSON.stringify({
          version: 1,
          entries: [{ seriesId: 'shadow-kiss', episode: 0, updatedAt: 1 }],
        }),
      ),
    ).toEqual({ status: 'corrupt' });

    const loaded = loadViewingProgress(
      JSON.stringify({
        version: 1,
        entries: [
          { seriesId: 'shadow-kiss', episode: 1, updatedAt: 5 },
          { seriesId: 'shadow-kiss', episode: 2, updatedAt: 9 },
        ],
      }),
    );

    expect(loaded).toEqual({
      status: 'ready',
      entries: [{ seriesId: 'shadow-kiss', episode: 2, updatedAt: 9 }],
    });
    expect(serializeViewingProgress([])).toContain('"version":1');
  });
});

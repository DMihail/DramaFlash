import { type MockRequestOptions, runMockRequest } from '@/api/mockRequest';
import { type SeriesLookup } from '@/api/series';
import { findSeries, type Series } from '@/data/catalog';
import { isEpisodeInSeries } from '@/domain/wallet';

export type PlayerMediaStatus = 'artwork' | 'unavailable';

export type PlayerEpisodeData = {
  series: Series;
  episode: number;
  media: PlayerMediaStatus;
};

export type PlayerEpisodeResult =
  | { status: 'success'; data: PlayerEpisodeData }
  | { status: 'not-found' }
  | { status: 'out-of-range' };

export type PlayerRequestOptions = MockRequestOptions & {
  lookup?: SeriesLookup;
  media?: PlayerMediaStatus;
};

export async function loadPlayerEpisode(
  seriesId: string,
  episode: number,
  options?: PlayerRequestOptions,
): Promise<PlayerEpisodeResult> {
  await runMockRequest(options);
  const lookup = options?.lookup ?? findSeries;
  const series = lookup(seriesId);
  if (!series) {
    return { status: 'not-found' };
  }

  if (!isEpisodeInSeries(series.episodeCount, episode)) {
    return { status: 'out-of-range' };
  }

  return {
    status: 'success',
    data: {
      series,
      episode,
      media: options?.media ?? 'artwork',
    },
  };
}

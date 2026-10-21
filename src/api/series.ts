import { type MockRequestOptions, runMockRequest } from '@/api/mockRequest';
import { findSeries, type Series } from '@/data/catalog';

// Screens call these functions and keep the result in a typed load state.
// A later backend can replace the function bodies. The screen should not change
// as long as these result types stay the same. Cancel an in-flight call with AbortSignal.

export type SeriesLookup = (seriesId: string) => Series | undefined;

export type SeriesRequestOptions = MockRequestOptions & {
  lookup?: SeriesLookup;
};

export type SeriesEpisode = {
  number: number;
};

export type SeriesByIdResult = { status: 'success'; series: Series } | { status: 'not-found' };

export type EpisodeListResult =
  { status: 'success'; episodes: SeriesEpisode[] } | { status: 'empty' } | { status: 'not-found' };

export type RecommendationResult =
  { status: 'success'; series: Series[] } | { status: 'empty' } | { status: 'not-found' };

export type SeriesDetailsData = {
  series: Series;
  episodes: SeriesEpisode[];
  episodeStatus: 'success' | 'empty';
  recommendations: Series[];
  recommendationStatus: 'success' | 'empty';
};

export type SeriesDetailsResult =
  { status: 'success'; data: SeriesDetailsData } | { status: 'not-found' };

export const detailRecommendationIds = [
  'forbidden-vows',
  'love-in-the-fast-lane',
  'the-heirs-dilemma',
] as const;

export function buildEpisodeList(
  episodeCount: number | null,
): Exclude<EpisodeListResult, { status: 'not-found' }> {
  if (episodeCount === null || !Number.isInteger(episodeCount) || episodeCount < 1) {
    return { status: 'empty' };
  }

  const episodes: SeriesEpisode[] = [];
  for (let number = 1; number <= episodeCount; number += 1) {
    episodes.push({ number });
  }

  return { status: 'success', episodes };
}

export function recommendedSeries(seriesId: string, lookup: SeriesLookup = findSeries): Series[] {
  const series: Series[] = [];

  for (const id of detailRecommendationIds) {
    if (id === seriesId) {
      continue;
    }

    const match = lookup(id);
    if (match && match.id !== seriesId) {
      series.push(match);
    }
  }

  return series;
}

export async function fetchSeriesById(
  seriesId: string,
  options?: SeriesRequestOptions,
): Promise<SeriesByIdResult> {
  await runMockRequest(options);
  const series = lookupSeries(seriesId, options);
  if (!series) {
    return { status: 'not-found' };
  }

  return { status: 'success', series };
}

export async function fetchSeriesEpisodes(
  seriesId: string,
  options?: SeriesRequestOptions,
): Promise<EpisodeListResult> {
  await runMockRequest(options);
  const series = lookupSeries(seriesId, options);
  if (!series) {
    return { status: 'not-found' };
  }

  return buildEpisodeList(series.episodeCount);
}

export async function fetchRecommendedSeries(
  seriesId: string,
  options?: SeriesRequestOptions,
): Promise<RecommendationResult> {
  await runMockRequest(options);
  const series = lookupSeries(seriesId, options);
  if (!series) {
    return { status: 'not-found' };
  }

  const recommendations = recommendedSeries(series.id, options?.lookup ?? findSeries);
  if (recommendations.length === 0) {
    return { status: 'empty' };
  }

  return { status: 'success', series: recommendations };
}

export async function loadSeriesDetails(
  seriesId: string,
  options?: SeriesRequestOptions,
): Promise<SeriesDetailsResult> {
  await runMockRequest(options);
  const series = lookupSeries(seriesId, options);
  if (!series) {
    return { status: 'not-found' };
  }

  const episodes = buildEpisodeList(series.episodeCount);
  const recommendations = recommendedSeries(series.id, options?.lookup ?? findSeries);

  return {
    status: 'success',
    data: {
      series,
      episodes: episodes.status === 'success' ? episodes.episodes : [],
      episodeStatus: episodes.status,
      recommendations,
      recommendationStatus: recommendations.length === 0 ? 'empty' : 'success',
    },
  };
}

function lookupSeries(seriesId: string, options?: SeriesRequestOptions): Series | undefined {
  const lookup = options?.lookup ?? findSeries;
  return lookup(seriesId);
}

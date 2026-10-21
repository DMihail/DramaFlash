import { type Href } from 'expo-router';

import { type SeriesDetailsData, type SeriesEpisode } from '@/api/series';
import {
  EPISODE_COST,
  FREE_EPISODE_LIMIT,
  isEpisodeInSeries,
  isEpisodeUnlocked,
  type Wallet,
} from '@/domain/wallet';
import { loginDestination, requestSeriesSave, seriesDestination } from '@/features/home/model';

export const episodePreviewLimit = 6;

export const seriesNotFoundTitle = 'Series not found';
export const seriesErrorMessage = 'The series could not be loaded.';
export const emptyEpisodesMessage = 'The episode list is not in the source data.';
export const sharingUnavailableMessage = 'Sharing is not available on this device.';
export const continueTitle = 'Continue the Story';

export type EpisodeSort = 'asc' | 'desc';

export type EpisodeAccess = 'free' | 'unlocked' | 'locked' | 'invalid';

export type SeriesDetailsState =
  | { status: 'loading' }
  | { status: 'success'; data: SeriesDetailsData }
  | { status: 'not-found' }
  | { status: 'error' };

export type SeriesRequestIdentity = {
  seriesId: string;
  attempt: number;
};

export function detailsPanel(
  state: SeriesDetailsState,
): 'skeleton' | 'error' | 'not-found' | 'series' {
  switch (state.status) {
    case 'loading':
      return 'skeleton';
    case 'error':
      return 'error';
    case 'not-found':
      return 'not-found';
    case 'success':
      return 'series';
  }
}

export function shouldApplySeriesResult(
  request: SeriesRequestIdentity,
  current: SeriesRequestIdentity,
  aborted: boolean,
): boolean {
  return !aborted && request.seriesId === current.seriesId && request.attempt === current.attempt;
}

export function seriesSaveRequest(seriesId: string) {
  return requestSeriesSave(null, seriesId);
}

export function seriesLoginDestination(): Href {
  return loginDestination();
}

export function recommendationDestination(seriesId: string): Href {
  return seriesDestination(seriesId);
}

export function sharePayload(title: string): { message: string } {
  return { message: title };
}

export function episodeCountLabel(episodeCount: number | null): string {
  if (episodeCount === null) {
    return 'Episode count not confirmed';
  }

  return episodeCount === 1 ? '1 episode' : `${episodeCount} episodes`;
}

export function episodeMetaLabel(episodeCount: number | null): string | null {
  if (episodeCount === null) {
    return null;
  }

  return `${episodeCount} Eps`;
}

export function visibleEpisodes(
  episodes: readonly SeriesEpisode[],
  sort: EpisodeSort,
  expanded: boolean,
): SeriesEpisode[] {
  const ordered = sort === 'desc' ? [...episodes].reverse() : [...episodes];
  if (expanded || ordered.length <= episodePreviewLimit) {
    return ordered;
  }

  return ordered.slice(0, episodePreviewLimit);
}

export function episodeListCanToggle(count: number): boolean {
  return count > episodePreviewLimit;
}

export function playerDestination(
  seriesId: string,
  episode: number,
  episodeCount: number | null,
): Href | null {
  if (!isEpisodeInSeries(episodeCount, episode)) {
    return null;
  }

  return {
    pathname: '/player/[seriesId]',
    params: { seriesId, episode: String(episode) },
  };
}

export function episodeAccess(
  wallet: Wallet,
  seriesId: string,
  episode: number,
  episodeCount: number | null,
): EpisodeAccess {
  if (!isEpisodeInSeries(episodeCount, episode)) {
    return 'invalid';
  }

  if (episode <= FREE_EPISODE_LIMIT) {
    return 'free';
  }

  if (isEpisodeUnlocked(wallet, seriesId, episode)) {
    return 'unlocked';
  }

  return 'locked';
}

export function continueEpisode(
  wallet: Wallet,
  seriesId: string,
  episodeCount: number | null,
): number | null {
  if (episodeCount === null) {
    return null;
  }

  for (let episode = FREE_EPISODE_LIMIT + 1; episode <= episodeCount; episode += 1) {
    if (!isEpisodeUnlocked(wallet, seriesId, episode)) {
      return episode;
    }
  }

  return null;
}

export function continueMessage(episode: number): string {
  return `Episode ${episode} costs ${EPISODE_COST} coins. Unlock is not available yet, and opening it does not charge coins.`;
}

export function episodeActionLabel(access: EpisodeAccess, episode: number): string {
  switch (access) {
    case 'free':
      return `Episode ${episode}, free`;
    case 'unlocked':
      return `Episode ${episode}, unlocked`;
    case 'locked':
      return `Episode ${episode}, locked, ${EPISODE_COST} coins`;
    case 'invalid':
      return `Episode ${episode} is outside this series`;
  }
}

export function accessLabel(access: EpisodeAccess): string | null {
  switch (access) {
    case 'free':
      return 'Free';
    case 'unlocked':
      return 'Unlocked';
    case 'locked':
      return `${EPISODE_COST} coins`;
    case 'invalid':
      return null;
  }
}

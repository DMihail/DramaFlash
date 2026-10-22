import { type Href } from 'expo-router';

import { type PlayerEpisodeData } from '@/api/player';
import { EPISODE_COST, isEpisodeInSeries, type Wallet } from '@/domain/wallet';
import { type EpisodeAccess, episodeAccess, walletForEpisodes } from '@/features/series/model';

export const artworkPreviewMessage = 'Artwork preview. No video is playing.';
export const unavailableMediaMessage = 'This preview has no playable video.';
export const playerErrorMessage = 'The episode could not be loaded.';
export const episodeOutOfRangeMessage = 'That episode is not in this series.';
export const commentsUnavailableMessage = 'Comments are not available yet.';

export type PlayerRequestIdentity = {
  seriesId: string;
  episode: number | null;
  attempt: number;
};

export type PlayerPreview = 'artwork' | 'unavailable';

export function requestedEpisode(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return 1;
  }

  const episode = Number(value);
  if (!Number.isInteger(episode)) {
    return null;
  }

  return episode;
}

export function shouldApplyPlayerResult(
  request: PlayerRequestIdentity,
  current: PlayerRequestIdentity,
  aborted: boolean,
): boolean {
  return (
    !aborted &&
    request.seriesId === current.seriesId &&
    request.episode === current.episode &&
    request.attempt === current.attempt
  );
}

export function adjacentEpisode(
  episode: number,
  episodeCount: number | null,
  step: -1 | 1,
): number | null {
  const next = episode + step;
  if (!isEpisodeInSeries(episodeCount, next)) {
    return null;
  }

  return next;
}

export function playerAccess(
  wallet: Wallet | undefined,
  seriesId: string,
  episode: number,
  episodeCount: number | null,
): EpisodeAccess {
  return episodeAccess(walletForEpisodes(wallet), seriesId, episode, episodeCount);
}

export function previewFor(data: PlayerEpisodeData, hasArtwork: boolean): PlayerPreview {
  if (data.media === 'unavailable' || !hasArtwork) {
    return 'unavailable';
  }

  return 'artwork';
}

export function canPreviewPlayback(access: EpisodeAccess, preview: PlayerPreview): boolean {
  return preview === 'artwork' && (access === 'free' || access === 'unlocked');
}

export function playbackLabel(playing: boolean): string {
  return playing ? 'Playing artwork preview' : 'Paused artwork preview';
}

export function lockedEpisodeMessage(episode: number): string {
  return `Episode ${episode} is locked. It costs ${EPISODE_COST} coins. Opening unlock does not charge coins.`;
}

export function unlockDestination(seriesId: string, episode: number): Href {
  return {
    pathname: '/coins',
    params: { seriesId, episode: String(episode) },
  };
}

export type UnlockProduct = 'episode' | 'season' | 'membership';

/** Only a single episode can spend coins. Season and membership are not products. */
export function unlockSpendsCoins(product: UnlockProduct): boolean {
  return product === 'episode';
}

export function shareMessage(title: string, episode: number): { message: string } {
  return { message: `${title}, episode ${episode}` };
}

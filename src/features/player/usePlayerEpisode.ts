import { useEffect, useState } from 'react';

import { isMockRequestAborted } from '@/api/mockRequest';
import {
  loadPlayerEpisode,
  type PlayerEpisodeResult,
  type PlayerRequestOptions,
} from '@/api/player';
import { type PlayerRequestIdentity, shouldApplyPlayerResult } from '@/features/player/model';

export type PlayerLoader = (
  seriesId: string,
  episode: number,
  options?: PlayerRequestOptions,
) => Promise<PlayerEpisodeResult>;

export type PlayerState = { status: 'loading' } | PlayerEpisodeResult | { status: 'error' };

export function usePlayerEpisode(
  seriesId: string | undefined,
  episode: number | null,
  load: PlayerLoader = loadPlayerEpisode,
): {
  retry: () => void;
  state: PlayerState;
} {
  const [attempt, setAttempt] = useState(0);
  const [tracked, setTracked] = useState<PlayerRequestIdentity>({
    seriesId: seriesId ?? '',
    episode,
    attempt: 0,
  });
  const [state, setState] = useState<PlayerState>(initialPlayerState(seriesId, episode));

  if (
    (seriesId ?? '') !== tracked.seriesId ||
    episode !== tracked.episode ||
    attempt !== tracked.attempt
  ) {
    setTracked({ seriesId: seriesId ?? '', episode, attempt });
    setState(initialPlayerState(seriesId, episode));
  }

  useEffect(() => {
    if (!seriesId || episode === null) {
      return;
    }

    const controller = new AbortController();
    const request: PlayerRequestIdentity = { seriesId, episode, attempt };
    let aborted = false;

    load(seriesId, episode, { signal: controller.signal })
      .then((result) => {
        if (!shouldApplyPlayerResult(request, { seriesId, episode, attempt }, aborted)) {
          return;
        }

        setState(result);
      })
      .catch((error: unknown) => {
        if (!shouldApplyPlayerResult(request, { seriesId, episode, attempt }, aborted)) {
          return;
        }

        if (isMockRequestAborted(error)) {
          return;
        }

        setState({ status: 'error' });
      });

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [attempt, episode, load, seriesId]);

  const retry = () => {
    setAttempt((current) => current + 1);
  };

  return { retry, state };
}

function initialPlayerState(seriesId: string | undefined, episode: number | null): PlayerState {
  if (!seriesId) {
    return { status: 'not-found' };
  }

  if (episode === null) {
    return { status: 'out-of-range' };
  }

  return { status: 'loading' };
}

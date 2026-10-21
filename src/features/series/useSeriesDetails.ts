import { useEffect, useState } from 'react';

import { isMockRequestAborted } from '@/api/mockRequest';
import { loadSeriesDetails } from '@/api/series';
import {
  type SeriesDetailsState,
  type SeriesRequestIdentity,
  shouldApplySeriesResult,
} from '@/features/series/model';

// A read-only request fits useEffect and AbortSignal. React `use` would need a
// promise cache and still would not cover error, empty, retry, or cancellation.
// useOptimistic and useActionState are for user actions that change data.

export function useSeriesDetails(seriesId: string | undefined): {
  retry: () => void;
  state: SeriesDetailsState;
} {
  const [attempt, setAttempt] = useState(0);
  const [tracked, setTracked] = useState<SeriesRequestIdentity>({
    seriesId: seriesId ?? '',
    attempt: 0,
  });
  const [state, setState] = useState<SeriesDetailsState>(
    seriesId ? { status: 'loading' } : { status: 'not-found' },
  );

  if ((seriesId ?? '') !== tracked.seriesId || attempt !== tracked.attempt) {
    setTracked({ seriesId: seriesId ?? '', attempt });
    setState(seriesId ? { status: 'loading' } : { status: 'not-found' });
  }

  useEffect(() => {
    if (!seriesId) {
      return;
    }

    const controller = new AbortController();
    const request: SeriesRequestIdentity = { seriesId, attempt };
    let aborted = false;

    loadSeriesDetails(seriesId, { signal: controller.signal })
      .then((result) => {
        if (!shouldApplySeriesResult(request, { seriesId, attempt }, aborted)) {
          return;
        }

        setState(result.status === 'not-found' ? { status: 'not-found' } : result);
      })
      .catch((error: unknown) => {
        if (!shouldApplySeriesResult(request, { seriesId, attempt }, aborted)) {
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
  }, [attempt, seriesId]);

  const retry = () => {
    setAttempt((current) => current + 1);
  };

  return { retry, state };
}

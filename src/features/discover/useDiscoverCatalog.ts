import { useEffect, useState } from 'react';

import { type DiscoverLoader, fetchDiscoverCatalog } from '@/api/discover';
import { isMockRequestAborted } from '@/api/mockRequest';
import { type Series } from '@/data/catalog';

export type DiscoverCatalogState =
  { status: 'loading' } | { status: 'ready'; series: readonly Series[] } | { status: 'error' };

// The catalog loads once. Search and genre filters run on that list, so typing
// does not start another request.
export function useDiscoverCatalog(load: DiscoverLoader = fetchDiscoverCatalog): {
  retry: () => void;
  state: DiscoverCatalogState;
} {
  const [attempt, setAttempt] = useState(0);
  const [trackedAttempt, setTrackedAttempt] = useState(0);
  const [state, setState] = useState<DiscoverCatalogState>({ status: 'loading' });

  if (attempt !== trackedAttempt) {
    setTrackedAttempt(attempt);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    const controller = new AbortController();
    let aborted = false;

    load({ signal: controller.signal })
      .then((series) => {
        if (aborted) {
          return;
        }

        setState({ status: 'ready', series });
      })
      .catch((error: unknown) => {
        if (aborted) {
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
  }, [attempt, load]);

  const retry = () => {
    setAttempt((current) => current + 1);
  };

  return { retry, state };
}

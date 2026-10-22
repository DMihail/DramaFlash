import { findSeries } from '@/data/catalog';
import { continueWatchingEntries, type ProgressEntry, visibleSavedIds } from '@/domain/library';
import { freshWallet, type Wallet } from '@/domain/wallet';
import { episodeMeta } from '@/features/home/model';
import { playerDestination } from '@/features/series/model';

export const libraryTitle = 'My Library';
export const libraryIntroTitle = 'Your next chapter';
export const libraryIntroBody = 'The stories you can’t stop thinking about.';
export const librarySavedTitle = 'Saved for you';
export const libraryContinueTitle = 'Continue watching';
export const librarySavedEmpty = 'No saved series yet. Tap the heart on a series to save it.';
export const libraryEmptyTitle = 'A little room for obsession.';
export const libraryEmptyBody = 'Save a series with the + button to find it here.';
export const libraryExploreLabel = 'Explore dramas';
export const librarySaveFailedMessage = 'The series could not be saved.';
export const progressSaveFailedMessage = 'Continue watching could not be saved on this device.';
export const libraryReadErrorMessage =
  'Saved series could not be read. Your library was not reset.';

export type LibraryPoster = {
  id: string;
  title: string;
  meta: string | null;
};

export type ContinueItem = {
  seriesId: string;
  title: string;
  episode: number;
  meta: string;
};

export function savedPosters(ids: readonly string[]): LibraryPoster[] {
  const posters: LibraryPoster[] = [];

  for (const id of visibleSavedIds(ids)) {
    const series = findSeries(id);
    if (!series) {
      continue;
    }

    posters.push({
      id: series.id,
      title: series.title,
      meta: episodeMeta(series.episodeCount),
    });
  }

  return posters;
}

export function continueItems(
  entries: readonly ProgressEntry[],
  wallet: Wallet | null,
): ContinueItem[] {
  const items: ContinueItem[] = [];

  for (const entry of continueWatchingEntries(entries, wallet ?? freshWallet())) {
    const series = findSeries(entry.seriesId);
    if (!series) {
      continue;
    }

    const destination = playerDestination(series.id, entry.episode, series.episodeCount);
    if (!destination) {
      continue;
    }

    items.push({
      seriesId: series.id,
      title: series.title,
      episode: entry.episode,
      meta: `Episode ${entry.episode}`,
    });
  }

  return items;
}

export type PurchaseLine = {
  seriesId: string;
  title: string;
  episodes: number[];
};

/**
 * Groups stored episode unlocks by series.
 *
 * The wallet remains the only record. Unknown series ids are left out.
 */
export function purchaseLines(wallet: Wallet): PurchaseLine[] {
  const grouped = new Map<string, number[]>();

  for (const unlock of wallet.unlocks) {
    if (!findSeries(unlock.seriesId)) {
      continue;
    }

    const episodes = grouped.get(unlock.seriesId) ?? [];
    if (!episodes.includes(unlock.episode)) {
      grouped.set(unlock.seriesId, [...episodes, unlock.episode]);
    }
  }

  return [...grouped.entries()]
    .map(([seriesId, episodes]) => ({
      seriesId,
      title: findSeries(seriesId)?.title ?? seriesId,
      episodes: [...episodes].sort((left, right) => left - right),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

/** Uses a real continue-watching episode when one is stored. */
export function savedProgressLabel(
  seriesId: string,
  episodeCount: number | null,
  items: readonly ContinueItem[],
): string | null {
  const match = items.find((item) => item.seriesId === seriesId);
  if (!match || episodeCount === null) {
    return episodeMeta(episodeCount);
  }

  return `Ep ${match.episode} / ${episodeCount}`;
}

export function resumeDestination(seriesId: string, episode: number) {
  const series = findSeries(seriesId);
  return playerDestination(seriesId, episode, series?.episodeCount ?? null);
}

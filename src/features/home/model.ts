import type { Href } from 'expo-router';

import { findSeries } from '@/data/catalog';
import { type DemoAuth, toggleSavedSeries } from '@/domain/auth';

export const homeGenres = ['All', 'Romance', 'Drama', 'Action', 'Mystery'] as const;

export type HomeGenre = (typeof homeGenres)[number];

export type HomeRail = {
  id: string;
  title: string;
  groupLabel: string | null;
  seriesIds: readonly string[];
};

export type HomePoster = {
  id: string;
  title: string;
  episodeCount: number | null;
};

export type SaveResult =
  | { type: 'login' }
  | { type: 'saved'; seriesId: string }
  | { type: 'removed'; seriesId: string }
  | { type: 'unavailable' };

const romanceIds = ['the-ceo-and-i', 'my-secret-life', 'love-on-detours'] as const;
const dramaIds = ['bloody-roses', 'shadow-kiss', 'dark-desire'] as const;
const actionIds = ['avenging-angel', 'band-of-fate', 'second-chance'] as const;

const romanceRail: HomeRail = {
  id: 'trending-romance',
  title: 'Trending Romance',
  groupLabel: 'Romance',
  seriesIds: romanceIds,
};

const dramaRail: HomeRail = {
  id: 'forbidden-love',
  title: 'Forbidden Love',
  groupLabel: null,
  seriesIds: dramaIds,
};

const watchedRail: HomeRail = {
  id: 'most-watched',
  title: 'Most Watched',
  groupLabel: 'Popular Micro Dramas',
  seriesIds: actionIds,
};

// The spotlight copy comes from the prototype. It is not a catalog series.
export const homeHero = {
  title: 'Forbidden Love',
  tagline: 'A CEO’s dangerous secret contract.',
  ratingLabel: '4.8',
  episodeLabel: '72 Episodes',
  tags: ['Romance', 'Drama', 'Billionaire'],
  seriesId: null,
} as const;

export const caughtUpMessage = 'You’re all caught up. Your next obsession awaits.';
export const spotlightMessage = 'This spotlight is not in the catalog yet.';
export const emptyCategoryMessage = 'No dramas in this category yet.';

export function visibleRails(genre: HomeGenre): readonly HomeRail[] {
  switch (genre) {
    case 'All':
      return [romanceRail, dramaRail, watchedRail];
    case 'Romance':
      return [romanceRail];
    case 'Drama':
      return [{ ...dramaRail, groupLabel: 'Drama' }];
    case 'Action':
      return [{ ...watchedRail, groupLabel: 'Action' }];
    case 'Mystery':
      return [];
  }
}

export function postersFor(seriesIds: readonly string[]): HomePoster[] {
  const posters: HomePoster[] = [];

  for (const id of seriesIds) {
    const series = findSeries(id);
    if (!series) {
      continue;
    }

    posters.push({
      id: series.id,
      title: series.title,
      episodeCount: series.episodeCount,
    });
  }

  return posters;
}

export function episodeMeta(episodeCount: number | null): string | null {
  if (episodeCount === null) {
    return null;
  }

  return `${episodeCount} Eps`;
}

export function seriesDestination(seriesId: string): Href {
  return { pathname: '/series/[seriesId]', params: { seriesId } };
}

export function discoverDestination(category: string): Href {
  return { pathname: '/discover', params: { category } };
}

export function searchDestination(): Href {
  return '/discover';
}

export function profileDestination(): Href {
  return '/profile';
}

export function loginDestination(): Href {
  return '/login';
}

export function romanceDestination(): Href {
  return discoverDestination('Romance');
}

export function watchNowDestination(seriesId: string | null): Href | null {
  if (!seriesId) {
    return null;
  }

  return seriesDestination(seriesId);
}

export function saveSeries(auth: DemoAuth, seriesId: string | null): SaveResult {
  if (!auth.provider) {
    return { type: 'login' };
  }

  if (!seriesId) {
    return { type: 'unavailable' };
  }

  const next = toggleSavedSeries(auth, seriesId);
  if (next.savedSeriesIds.includes(seriesId)) {
    return { type: 'saved', seriesId };
  }

  return { type: 'removed', seriesId };
}

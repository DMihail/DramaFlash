import type { Href } from 'expo-router';

import { findSeries } from '@/data/catalog';
import {
  createLoginTicket,
  type DemoAuth,
  type LoginTicket,
  toggleSavedSeries,
} from '@/domain/auth';

export const homeGenres = ['All', 'Romance', 'Drama', 'Action', 'Mystery'] as const;

export type HomeGenre = (typeof homeGenres)[number];

export type HomeRail = {
  id: string;
  title: string;
  genre: HomeGenre;
  groupLabel: string | null;
  seriesIds: readonly string[];
};

export type HomePoster = {
  id: string;
  title: string;
  episodeCount: number | null;
};

export type SaveRequest =
  | { type: 'login'; ticket: LoginTicket }
  | { type: 'saved'; seriesId: string }
  | { type: 'removed'; seriesId: string }
  | { type: 'unavailable' };

export type HomeSpotlight = {
  seriesId: string;
  title: string;
  episodeLabel: string;
  tagline: string;
};

/** Overlay copy read from the home hero on the board. */
export const homeHeroTagline = "A CEO's dangerous secret contract.";

const featuredSeriesId = 'the-ceo-and-i';

const romanceIds = ['the-ceo-and-i', 'my-secret-life', 'love-on-detours'] as const;
const dramaIds = ['bloody-roses', 'shadow-kiss', 'dark-desire'] as const;
const actionIds = ['avenging-angel', 'band-of-fate', 'second-chance'] as const;

const romanceRail: HomeRail = {
  id: 'trending-romance',
  title: 'Trending Romance',
  genre: 'Romance',
  groupLabel: 'Romance',
  seriesIds: romanceIds,
};

const dramaRail: HomeRail = {
  id: 'forbidden-love',
  title: 'Forbidden Love',
  genre: 'Drama',
  groupLabel: null,
  seriesIds: dramaIds,
};

const watchedRail: HomeRail = {
  id: 'most-watched',
  title: 'Most Watched',
  genre: 'Action',
  groupLabel: 'Popular Micro Dramas',
  seriesIds: actionIds,
};

// null means every catalog series. Home rails and Discover use this same list.
export function seriesIdsForGenre(genre: HomeGenre): readonly string[] | null {
  switch (genre) {
    case 'All':
      return null;
    case 'Romance':
      return romanceIds;
    case 'Drama':
      return dramaIds;
    case 'Action':
      return actionIds;
    case 'Mystery':
      return [];
  }
}

export const caughtUpMessage = 'You’re all caught up. Your next obsession awaits.';
export const emptyCategoryMessage = 'No dramas in this category yet.';

export function homeSpotlight(): HomeSpotlight | null {
  const series = findSeries(featuredSeriesId);
  if (!series || series.episodeCount === null) {
    return null;
  }

  return {
    seriesId: series.id,
    title: series.title,
    episodeLabel: `${series.episodeCount} Episodes`,
    tagline: homeHeroTagline,
  };
}

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
  // Send an empty category so Expo Router replaces the genre stored on the Discover tab.
  return { pathname: '/discover', params: { category: '' } };
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

export function requestSeriesSave(auth: DemoAuth | null, seriesId: string | null): SaveRequest {
  if (!seriesId || !findSeries(seriesId)) {
    return { type: 'unavailable' };
  }

  if (!auth?.provider) {
    return {
      type: 'login',
      ticket: createLoginTicket({
        currentScreen: 'home',
        destination: 'home',
        wasPlaying: false,
        seriesIdToSave: seriesId,
      }),
    };
  }

  const next = toggleSavedSeries(auth, seriesId);
  if (next.savedSeriesIds.includes(seriesId)) {
    return { type: 'saved', seriesId };
  }

  return { type: 'removed', seriesId };
}

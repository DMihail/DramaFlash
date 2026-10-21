import { type Series } from '@/data/catalog';
import {
  emptyCategoryMessage,
  type HomeGenre,
  homeGenres,
  seriesIdsForGenre,
} from '@/features/home/model';
import { layout, space } from '@/theme/tokens';

export const discoverTitle = 'Discover';
export const discoverSearchPlaceholder = 'Find your next obsession';
export const discoverSearchEmptyMessage = 'No dramas found. Try “Love” or “Secret”.';
export const discoverErrorMessage = 'Dramas could not be loaded.';

const railGenres = {
  'Trending Romance': 'Romance',
  'Forbidden Love': 'Drama',
  'Most Watched': 'Action',
} as const satisfies Record<string, HomeGenre>;

export function discoverGenre(category: string | undefined): HomeGenre {
  if (!category || category === 'All') {
    return 'All';
  }

  if ((homeGenres as readonly string[]).includes(category)) {
    return category as HomeGenre;
  }

  if (category in railGenres) {
    return railGenres[category as keyof typeof railGenres];
  }

  return 'All';
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function discoverHeading(query: string): string {
  return normalizeSearchQuery(query) ? 'Search results' : 'Stories you’ll love';
}

export function discoverEmptyMessage(query: string): string {
  if (normalizeSearchQuery(query)) {
    return discoverSearchEmptyMessage;
  }

  return emptyCategoryMessage;
}

export function filterDiscoverCatalog(
  series: readonly Series[],
  genre: HomeGenre,
  query: string,
): Series[] {
  const needle = normalizeSearchQuery(query);
  const allowed = seriesIdsForGenre(genre);
  const matches: Series[] = [];

  for (const item of series) {
    if (allowed && !allowed.includes(item.id)) {
      continue;
    }

    if (needle && !item.title.toLowerCase().includes(needle)) {
      continue;
    }

    matches.push(item);
  }

  return matches;
}

export function discoverPosterSize(screenWidth: number): { width: number; height: number } {
  const available = screenWidth - layout.marginScreen * 2 - space.md;
  const width = Math.max(1, Math.floor(available / 2));
  const ratio = layout.posterGrid.height / layout.posterGrid.width;

  return { width, height: Math.round(width * ratio) };
}

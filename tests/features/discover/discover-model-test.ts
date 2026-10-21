import { catalog } from '@/data/catalog';
import {
  discoverEmptyMessage,
  discoverGenre,
  discoverHeading,
  filterDiscoverCatalog,
  normalizeSearchQuery,
} from '@/features/discover/model';
import {
  emptyCategoryMessage,
  romanceDestination,
  seriesIdsForGenre,
  visibleRails,
} from '@/features/home/model';

describe('discover filters', () => {
  test('uses the same genre ids as Home', () => {
    expect(seriesIdsForGenre('Romance')).toEqual(visibleRails('Romance')[0]?.seriesIds);
    expect(seriesIdsForGenre('Drama')).toEqual(visibleRails('Drama')[0]?.seriesIds);
    expect(seriesIdsForGenre('Action')).toEqual(visibleRails('Action')[0]?.seriesIds);
    expect(seriesIdsForGenre('Mystery')).toEqual([]);
    expect(seriesIdsForGenre('All')).toBeNull();
  });

  test('reads a genre from Discover params, including older rail titles', () => {
    expect(discoverGenre(undefined)).toBe('All');
    expect(discoverGenre('Romance')).toBe('Romance');
    expect(discoverGenre('Trending Romance')).toBe('Romance');
    expect(discoverGenre('Forbidden Love')).toBe('Drama');
    expect(discoverGenre('Most Watched')).toBe('Action');
    expect(discoverGenre('Mystery')).toBe('Mystery');
    expect(romanceDestination()).toEqual({
      pathname: '/discover',
      params: { category: 'Romance' },
    });
  });

  test('matches titles without caring about case or surrounding spaces', () => {
    expect(normalizeSearchQuery('  Love  ')).toBe('love');
    expect(filterDiscoverCatalog(catalog, 'All', '  Love  ').map((series) => series.id)).toEqual([
      'love-on-detours',
      'love-in-the-fast-lane',
    ]);
    expect(filterDiscoverCatalog(catalog, 'All', 'secret').map((series) => series.title)).toEqual([
      'My Secret Life',
    ]);
    expect(filterDiscoverCatalog(catalog, 'All', '   ')).toHaveLength(catalog.length);
    expect(filterDiscoverCatalog(catalog, 'All', 'zzzz')).toEqual([]);
  });

  test('combines the search text with the selected genre', () => {
    expect(filterDiscoverCatalog(catalog, 'Romance', 'love').map((series) => series.id)).toEqual([
      'love-on-detours',
    ]);
    expect(filterDiscoverCatalog(catalog, 'Mystery', '')).toEqual([]);
    expect(discoverHeading('love')).toBe('Search results');
    expect(discoverHeading('  ')).toBe('Stories you’ll love');
    expect(discoverEmptyMessage('zzzz')).toBe('No dramas found. Try “Love” or “Secret”.');
    expect(discoverEmptyMessage('')).toBe(emptyCategoryMessage);
  });
});

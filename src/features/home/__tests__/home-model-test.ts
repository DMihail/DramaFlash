import { catalog } from '@/data/catalog';
import { guestAuth } from '@/domain/auth';
import {
  discoverDestination,
  episodeMeta,
  loginDestination,
  postersFor,
  profileDestination,
  romanceDestination,
  saveSeries,
  searchDestination,
  seriesDestination,
  visibleRails,
  watchNowDestination,
} from '@/features/home/model';

describe('home catalog', () => {
  test('shows the nine home series from the catalog, in rail order', () => {
    const ids = visibleRails('All').flatMap((rail) => rail.seriesIds);

    expect(ids).toEqual(catalog.slice(0, 9).map((series) => series.id));
    expect(ids).not.toContain('forbidden-vows');
    expect(postersFor(ids).map((poster) => poster.title)).toEqual([
      'The CEO and I',
      'My Secret Life',
      'Love on Detours',
      'Bloody Roses',
      'Shadow Kiss',
      'Dark Desire',
      'Avenging Angel',
      'Band of Fate',
      'Second Chance',
    ]);
  });

  test('filters rails by the selected genre', () => {
    expect(visibleRails('Romance').map((rail) => rail.title)).toEqual(['Trending Romance']);
    expect(visibleRails('Romance')[0]?.seriesIds).toEqual([
      'the-ceo-and-i',
      'my-secret-life',
      'love-on-detours',
    ]);
    expect(visibleRails('Drama')[0]).toMatchObject({
      title: 'Forbidden Love',
      groupLabel: 'Drama',
      seriesIds: ['bloody-roses', 'shadow-kiss', 'dark-desire'],
    });
    expect(visibleRails('Action')[0]?.seriesIds).toEqual([
      'avenging-angel',
      'band-of-fate',
      'second-chance',
    ]);
    expect(visibleRails('Mystery')).toEqual([]);
  });

  test('drops a series id that is not in the catalog', () => {
    expect(postersFor(['missing-series', 'shadow-kiss'])).toEqual([
      { id: 'shadow-kiss', title: 'Shadow Kiss', episodeCount: 45 },
    ]);
    expect(episodeMeta(50)).toBe('50 Eps');
    expect(episodeMeta(null)).toBeNull();
  });

  test('builds navigation destinations from catalog ids and rail titles', () => {
    expect(seriesDestination('love-on-detours')).toEqual({
      pathname: '/series/[seriesId]',
      params: { seriesId: 'love-on-detours' },
    });
    expect(discoverDestination('Trending Romance')).toEqual({
      pathname: '/discover',
      params: { category: 'Trending Romance' },
    });
    expect(searchDestination()).toBe('/discover');
    expect(profileDestination()).toBe('/profile');
    expect(romanceDestination()).toEqual({
      pathname: '/discover',
      params: { category: 'Romance' },
    });
    expect(watchNowDestination(null)).toBeNull();
    expect(watchNowDestination('the-ceo-and-i')).toEqual(seriesDestination('the-ceo-and-i'));
  });

  test('sends a guest to login and does not mark a series saved', () => {
    const guest = guestAuth();

    expect(saveSeries(guest, 'the-ceo-and-i')).toEqual({ type: 'login' });
    expect(saveSeries(guest, null)).toEqual({ type: 'login' });
    expect(guest.savedSeriesIds).toEqual([]);
    expect(loginDestination()).toBe('/login');
  });

  test('saves only when the viewer is signed in and the series id exists', () => {
    const signedIn = { provider: 'email' as const, savedSeriesIds: [] as string[] };

    expect(saveSeries(signedIn, null)).toEqual({ type: 'unavailable' });
    expect(saveSeries(signedIn, 'the-ceo-and-i')).toEqual({
      type: 'saved',
      seriesId: 'the-ceo-and-i',
    });
    expect(signedIn.savedSeriesIds).toEqual([]);
    expect(
      saveSeries({ provider: 'google', savedSeriesIds: ['the-ceo-and-i'] }, 'the-ceo-and-i'),
    ).toEqual({ type: 'removed', seriesId: 'the-ceo-and-i' });
  });
});

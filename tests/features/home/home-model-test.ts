import { catalog, findSeries } from '@/data/catalog';
import { posterArt } from '@/features/home/assets';
import {
  discoverDestination,
  episodeMeta,
  homeSpotlight,
  loginDestination,
  postersFor,
  profileDestination,
  requestSeriesSave,
  romanceDestination,
  searchDestination,
  seriesDestination,
  visibleRails,
  watchNowDestination,
} from '@/features/home/model';
import { clearLoginTicket, holdLoginTicket, readLoginTicket } from '@/navigation/pendingLogin';

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
    expect(searchDestination()).toEqual({
      pathname: '/discover',
      params: { category: '' },
    });
    expect(profileDestination()).toBe('/profile');
    expect(romanceDestination()).toEqual({
      pathname: '/discover',
      params: { category: 'Romance' },
    });
    expect(watchNowDestination(null)).toBeNull();
    expect(watchNowDestination('the-ceo-and-i')).toEqual(seriesDestination('the-ceo-and-i'));
  });

  test('features a catalog series whose title and episode count match that record', () => {
    const series = findSeries('the-ceo-and-i');
    const spotlight = homeSpotlight();

    expect(series?.episodeCount).toBe(50);
    expect(spotlight).toEqual({
      seriesId: 'the-ceo-and-i',
      title: 'The CEO and I',
      episodeLabel: '50 Episodes',
      tagline: "A CEO's dangerous secret contract.",
    });
    expect(spotlight && watchNowDestination(spotlight.seriesId)).toEqual(
      seriesDestination('the-ceo-and-i'),
    );
    expect(spotlight ? posterArt(spotlight.seriesId) : undefined).toBeTruthy();
  });

  test('keeps the series id for login and does not mark it saved', () => {
    clearLoginTicket();
    const result = requestSeriesSave(null, 'the-ceo-and-i');

    expect(result).toEqual({
      type: 'login',
      ticket: {
        origin: 'home',
        destination: 'home',
        wasPlaying: false,
        seriesIdToSave: 'the-ceo-and-i',
      },
    });
    expect(requestSeriesSave({ provider: null, savedSeriesIds: [] }, 'missing-series')).toEqual({
      type: 'unavailable',
    });
    if (result.type !== 'login') {
      throw new Error('expected a login ticket');
    }

    holdLoginTicket(result.ticket);
    expect(readLoginTicket()?.seriesIdToSave).toBe('the-ceo-and-i');
    expect(loginDestination()).toBe('/login');
    clearLoginTicket();
    expect(readLoginTicket()).toBeNull();
  });

  test('saves only when a signed-in session and a catalog series are both present', () => {
    const signedIn = { provider: 'email' as const, savedSeriesIds: [] as string[] };

    expect(requestSeriesSave(signedIn, null)).toEqual({ type: 'unavailable' });
    expect(requestSeriesSave(signedIn, 'the-ceo-and-i')).toEqual({
      type: 'saved',
      seriesId: 'the-ceo-and-i',
    });
    expect(signedIn.savedSeriesIds).toEqual([]);
    expect(
      requestSeriesSave({ provider: 'google', savedSeriesIds: ['the-ceo-and-i'] }, 'the-ceo-and-i'),
    ).toEqual({ type: 'removed', seriesId: 'the-ceo-and-i' });
  });
});

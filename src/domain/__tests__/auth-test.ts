import { WALLET_STORAGE_KEY } from '@/domain/wallet';
import {
  AUTH_STORAGE_KEY,
  cancelLogin,
  createLoginTicket,
  guestAuth,
  isSeriesSaved,
  loadAuth,
  resetSavedSeries,
  signIn,
  signOut,
  signedInScreen,
  toggleSavedSeries,
} from '@/domain/auth';

describe('demo auth', () => {
  test('starts as a guest', () => {
    expect(loadAuth({ getItem: () => null })).toEqual(guestAuth());
  });

  test('keeps the provider and saved series ids after reload', () => {
    for (const provider of ['google', 'apple', 'email', null] as const) {
      const expected = { provider, savedSeriesIds: ['the-ceo-and-i', 'shadow-kiss'] };
      const stored = new Map([[AUTH_STORAGE_KEY, JSON.stringify(expected)]]);

      expect(loadAuth({ getItem: (key) => stored.get(key) ?? null })).toEqual(expected);
    }
  });

  test('returns a guest when storage is invalid', () => {
    for (const raw of [
      '{',
      'null',
      'true',
      '{"provider":"other","savedSeriesIds":[]}',
      '{"provider":"google"}',
      '{"provider":"google","savedSeries":true}',
      '{"provider":"google","savedSeriesIds":[""]}',
    ]) {
      expect(loadAuth({ getItem: () => raw })).toEqual(guestAuth());
    }

    expect(
      loadAuth({
        getItem: () => {
          throw new Error('Unavailable');
        },
      }),
    ).toEqual(guestAuth());
  });

  test('reads only the auth key', () => {
    const coins = JSON.stringify({ balance: 5, unlocks: [] });
    const stored = new Map<string, string>([
      [AUTH_STORAGE_KEY, '{"provider":"email","savedSeriesIds":["the-ceo-and-i"]}'],
      [WALLET_STORAGE_KEY, coins],
    ]);
    const reads: string[] = [];

    loadAuth({
      getItem: (key) => {
        reads.push(key);
        return stored.get(key) ?? null;
      },
    });

    expect(reads).toEqual([AUTH_STORAGE_KEY]);
    expect(stored.get(WALLET_STORAGE_KEY)).toBe(coins);
  });

  test('a ticket opened from login returns home on cancel', () => {
    const ticket = createLoginTicket({
      currentScreen: 'login',
      destination: 'series',
      wasPlaying: true,
      seriesIdToSave: 'the-ceo-and-i',
    });

    expect(ticket.origin).toBe('home');
    expect(cancelLogin(ticket)).toEqual({ screen: 'home', wasPlaying: true });
    expect(cancelLogin(null)).toEqual({ screen: 'home', wasPlaying: false });
    expect(signedInScreen(null)).toBe('home');
  });

  test('saves a series only after sign-in, and a guest cancel does not', () => {
    const ticket = createLoginTicket({
      currentScreen: 'series',
      destination: 'series',
      wasPlaying: false,
      seriesIdToSave: 'the-ceo-and-i',
    });

    expect(cancelLogin(ticket)).toEqual({ screen: 'series', wasPlaying: false });

    const signedIn = signIn(guestAuth(), 'email', ticket);

    expect(signedIn).toEqual({ provider: 'email', savedSeriesIds: ['the-ceo-and-i'] });
    expect(signedInScreen(ticket)).toBe('series');
    expect(isSeriesSaved(signedIn, 'the-ceo-and-i')).toBe(true);
    expect(signIn(signedIn, 'google', ticket)).toBe(signedIn);
  });

  test('sign-out keeps saved ids and reset clears them', () => {
    const signedIn = signIn(
      guestAuth(),
      'apple',
      createLoginTicket({
        currentScreen: 'home',
        destination: 'library',
        wasPlaying: true,
        seriesIdToSave: 'shadow-kiss',
      }),
    );
    const signedOut = signOut(signedIn);

    expect(signedOut.provider).toBeNull();
    expect(signedOut.savedSeriesIds).toEqual(['shadow-kiss']);
    expect(isSeriesSaved(signedOut, 'shadow-kiss')).toBe(false);

    const reset = resetSavedSeries(signedIn);

    expect(reset.provider).toBe('apple');
    expect(reset.savedSeriesIds).toEqual([]);
  });

  test('a signed-in user can add and remove one series id', () => {
    const guest = guestAuth();
    expect(toggleSavedSeries(guest, 'the-ceo-and-i')).toBe(guest);

    const signedIn = { provider: 'google' as const, savedSeriesIds: [] as string[] };
    const saved = toggleSavedSeries(signedIn, 'the-ceo-and-i');
    const both = toggleSavedSeries(saved, 'shadow-kiss');
    const removed = toggleSavedSeries(both, 'the-ceo-and-i');

    expect(saved.savedSeriesIds).toEqual(['the-ceo-and-i']);
    expect(both.savedSeriesIds).toEqual(['the-ceo-and-i', 'shadow-kiss']);
    expect(removed.savedSeriesIds).toEqual(['shadow-kiss']);
  });
});

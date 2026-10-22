import {
  cancelLogin,
  createLoginTicket,
  guestAuth,
  signedInScreen,
  signIn,
  signOut,
  toggleSavedSeries,
} from '@/domain/auth';

describe('demo auth', () => {
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
    expect(signIn(signedIn, 'google', ticket)).toBe(signedIn);
  });

  test('sign-out keeps saved ids', () => {
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

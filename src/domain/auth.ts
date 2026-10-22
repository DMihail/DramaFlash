/**
 * Pure sign-in decisions from the original demo.
 *
 * Saved series in this type are not the device library. The library store
 * persists saves, and the session store persists only the provider. These
 * helpers still decide the login ticket when a screen has no library store.
 */
export type DemoProvider = 'google' | 'apple' | 'email';

export type DemoAuth = {
  provider: DemoProvider | null;
  savedSeriesIds: string[];
};

export type LoginTicket = {
  origin: string;
  destination: string;
  wasPlaying: boolean;
  seriesIdToSave: string | null;
};

export function guestAuth(): DemoAuth {
  return { provider: null, savedSeriesIds: [] };
}

export function createLoginTicket(input: {
  currentScreen: string;
  destination: string;
  wasPlaying: boolean;
  seriesIdToSave?: string | null;
}): LoginTicket {
  return {
    origin: input.currentScreen === 'login' ? 'home' : input.currentScreen,
    destination: input.destination,
    wasPlaying: input.wasPlaying,
    seriesIdToSave: input.seriesIdToSave ? input.seriesIdToSave : null,
  };
}

export function signIn(
  auth: DemoAuth,
  provider: DemoProvider,
  ticket: LoginTicket | null,
): DemoAuth {
  if (auth.provider) {
    return auth;
  }

  return {
    provider,
    savedSeriesIds: rememberSeries(auth.savedSeriesIds, ticket?.seriesIdToSave ?? null),
  };
}

export function cancelLogin(ticket: LoginTicket | null): { screen: string; wasPlaying: boolean } {
  if (!ticket) {
    return { screen: 'home', wasPlaying: false };
  }

  return { screen: ticket.origin, wasPlaying: ticket.wasPlaying };
}

export function signedInScreen(ticket: LoginTicket | null): string {
  return ticket?.destination ?? 'home';
}

export function signOut(auth: DemoAuth): DemoAuth {
  if (!auth.provider) {
    return auth;
  }

  return { ...auth, provider: null };
}

export function toggleSavedSeries(auth: DemoAuth, seriesId: string): DemoAuth {
  if (!auth.provider || seriesId.length === 0) {
    return auth;
  }

  if (auth.savedSeriesIds.includes(seriesId)) {
    return { ...auth, savedSeriesIds: auth.savedSeriesIds.filter((id) => id !== seriesId) };
  }

  return { ...auth, savedSeriesIds: [...auth.savedSeriesIds, seriesId] };
}

function rememberSeries(ids: string[], seriesId: string | null): string[] {
  if (!seriesId || ids.includes(seriesId)) {
    return ids;
  }

  return [...ids, seriesId];
}

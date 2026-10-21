export const AUTH_STORAGE_KEY = 'dramaflash.auth-demo.v1';

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

export type KeyValueStore = {
  getItem: (key: string) => string | null;
};

const providers: readonly DemoProvider[] = ['google', 'apple', 'email'];

export function guestAuth(): DemoAuth {
  return { provider: null, savedSeriesIds: [] };
}

export function loadAuth(storage: KeyValueStore): DemoAuth {
  try {
    const value: unknown = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? 'null');
    if (!isAuthRecord(value)) {
      return guestAuth();
    }

    return {
      provider: value.provider,
      savedSeriesIds: uniqueIds(value.savedSeriesIds),
    };
  } catch {
    return guestAuth();
  }
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

export function resetSavedSeries(auth: DemoAuth): DemoAuth {
  if (auth.savedSeriesIds.length === 0) {
    return auth;
  }

  return { ...auth, savedSeriesIds: [] };
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

export function isSeriesSaved(auth: DemoAuth, seriesId: string): boolean {
  return auth.provider !== null && auth.savedSeriesIds.includes(seriesId);
}

function rememberSeries(ids: string[], seriesId: string | null): string[] {
  if (!seriesId || ids.includes(seriesId)) {
    return ids;
  }

  return [...ids, seriesId];
}

function isAuthRecord(value: unknown): value is DemoAuth {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { provider?: unknown; savedSeriesIds?: unknown };
  return (
    (record.provider === null ||
      (typeof record.provider === 'string' &&
        providers.includes(record.provider as DemoProvider))) &&
    Array.isArray(record.savedSeriesIds) &&
    record.savedSeriesIds.every((id) => typeof id === 'string' && id.length > 0)
  );
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

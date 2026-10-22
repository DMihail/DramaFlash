import { type DemoSession, loadSession, serializeSession } from '@/domain/session';
import { type LocalStorage, MMKV_SESSION_KEY } from '@/storage/persistence';

export type PersistedSession =
  { status: 'ready'; session: DemoSession } | { status: 'error'; reason: 'corrupt' | 'unreadable' };

export async function loadPersistedSession(local: LocalStorage): Promise<PersistedSession> {
  let raw: string | undefined;

  try {
    raw = await local.getString(MMKV_SESSION_KEY);
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  const loaded = loadSession(raw);
  if (loaded.status === 'corrupt') {
    return { status: 'error', reason: 'corrupt' };
  }

  return {
    status: 'ready',
    session: loaded.status === 'ready' ? loaded.session : { provider: null },
  };
}

export async function commitSession(local: LocalStorage, session: DemoSession): Promise<void> {
  const payload = serializeSession(session);
  const previous = await local.getString(MMKV_SESSION_KEY);

  try {
    await local.setString(MMKV_SESSION_KEY, payload);
    const readBack = await local.getString(MMKV_SESSION_KEY);
    const loaded = readBack === undefined ? null : loadSession(readBack);
    if (
      readBack !== payload ||
      loaded?.status !== 'ready' ||
      loaded.session.provider !== session.provider
    ) {
      throw new Error('Session write could not be verified');
    }
  } catch (error) {
    await restoreSession(local, previous);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Session write could not be verified');
  }
}

async function restoreSession(local: LocalStorage, previous: string | undefined): Promise<void> {
  try {
    if (previous === undefined) {
      await local.delete(MMKV_SESSION_KEY);
      return;
    }

    await local.setString(MMKV_SESSION_KEY, previous);
  } catch {
    // The visible session stays unchanged either way.
  }
}

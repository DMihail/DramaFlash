import { type DemoSession, loadSession, serializeSession } from '@/domain/session';
import { commitVerifiedRecord, type LocalStorage, MMKV_SESSION_KEY } from '@/storage/persistence';

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

/** Saves the demo provider. The email address, password, and token are not written. */
export async function commitSession(local: LocalStorage, session: DemoSession): Promise<void> {
  const payload = serializeSession(session);

  await commitVerifiedRecord(
    local,
    MMKV_SESSION_KEY,
    payload,
    (readBack) => {
      const loaded = loadSession(readBack);
      return loaded.status === 'ready' && loaded.session.provider === session.provider;
    },
    'Session write could not be verified',
  );
}

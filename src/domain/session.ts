import { type DemoProvider } from '@/domain/auth';

export const SESSION_SCHEMA_VERSION = 1;

export type DemoSession = {
  provider: DemoProvider | null;
};

export type SessionLoadResult =
  { status: 'guest' } | { status: 'ready'; session: DemoSession } | { status: 'corrupt' };

const providers: readonly DemoProvider[] = ['google', 'apple', 'email'];

export function guestSession(): DemoSession {
  return { provider: null };
}

export function loadSession(raw: string | undefined): SessionLoadResult {
  if (raw === undefined) {
    return { status: 'guest' };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isSessionRecord(value)) {
      return { status: 'corrupt' };
    }

    return { status: 'ready', session: { provider: value.provider } };
  } catch {
    return { status: 'corrupt' };
  }
}

export function serializeSession(session: DemoSession): string {
  return JSON.stringify({
    schema: SESSION_SCHEMA_VERSION,
    provider: session.provider,
  });
}

export function validateDemoEmail(value: string): { ok: true } | { ok: false; message: string } {
  const email = value.trim();

  if (email.length === 0) {
    return { ok: false, message: 'Enter an email address.' };
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  return { ok: true };
}

export function demoProviderLabel(provider: DemoProvider | null): string {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    case 'email':
      return 'Email';
    default:
      return 'Guest';
  }
}

function isSessionRecord(
  value: unknown,
): value is { schema: number; provider: DemoProvider | null } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { schema?: unknown; provider?: unknown };

  return (
    record.schema === SESSION_SCHEMA_VERSION &&
    (record.provider === null ||
      (typeof record.provider === 'string' && providers.includes(record.provider as DemoProvider)))
  );
}

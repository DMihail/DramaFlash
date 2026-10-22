import { loadSession, serializeSession, validateDemoEmail } from '@/domain/session';

describe('demo session', () => {
  test('treats a missing record as a guest', () => {
    expect(loadSession(undefined)).toEqual({ status: 'guest' });
  });

  test('keeps only the demo provider', () => {
    const raw = serializeSession({ provider: 'email' });

    expect(raw).not.toContain('@');
    expect(loadSession(raw)).toEqual({ status: 'ready', session: { provider: 'email' } });
  });

  test('rejects a broken record instead of inventing a guest session', () => {
    for (const raw of ['{', 'null', '{"schema":1}', '{"schema":1,"provider":"password"}']) {
      expect(loadSession(raw)).toEqual({ status: 'corrupt' });
    }
  });

  test('checks a demo email without storing it', () => {
    expect(validateDemoEmail('  ')).toEqual({ ok: false, message: 'Enter an email address.' });
    expect(validateDemoEmail('not-an-email')).toEqual({
      ok: false,
      message: 'Enter a valid email address.',
    });
    expect(validateDemoEmail(' guest@example.com ')).toEqual({ ok: true });
  });
});

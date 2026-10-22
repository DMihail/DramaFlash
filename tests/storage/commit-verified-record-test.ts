import { commitVerifiedRecord, type LocalStorage } from '@/storage/persistence';

type Controls = {
  local: LocalStorage;
  value: () => string | undefined;
  failWrite: () => void;
  mismatch: () => void;
  failRestore: () => void;
};

function memory(initial?: string): Controls {
  let stored = initial;
  let failWrite = false;
  let mismatch = false;
  let failRestore = false;
  let reads = 0;
  let writes = 0;

  return {
    value: () => stored,
    failWrite: () => {
      failWrite = true;
    },
    mismatch: () => {
      mismatch = true;
    },
    failRestore: () => {
      failRestore = true;
    },
    local: {
      getString: async (key) => {
        if (key !== 'record') {
          return undefined;
        }

        reads += 1;
        if (mismatch && reads > 1) {
          return 'other';
        }

        return stored;
      },
      setString: async (key, value) => {
        if (key !== 'record') {
          return;
        }

        writes += 1;
        if (failWrite && writes === 1) {
          throw new Error('write failed');
        }

        if (failRestore && writes > 1) {
          throw new Error('restore failed');
        }

        stored = value;
      },
      delete: async (key) => {
        if (key !== 'record') {
          return;
        }

        if (failRestore) {
          throw new Error('restore failed');
        }

        stored = undefined;
      },
    },
  };
}

describe('verified storage writes', () => {
  test('keeps the payload when the read-back matches', async () => {
    const saved = memory();

    await commitVerifiedRecord(saved.local, 'record', 'next', () => true, 'not verified');

    expect(saved.value()).toBe('next');
  });

  test('restores the previous bytes when the write throws', async () => {
    const saved = memory('previous');
    saved.failWrite();

    await expect(
      commitVerifiedRecord(saved.local, 'record', 'next', () => true, 'not verified'),
    ).rejects.toThrow('write failed');
    expect(saved.value()).toBe('previous');
  });

  test('restores the previous bytes when the read-back does not match', async () => {
    const saved = memory('previous');
    saved.mismatch();

    await expect(
      commitVerifiedRecord(saved.local, 'record', 'next', () => true, 'not verified'),
    ).rejects.toThrow('not verified');
    expect(saved.value()).toBe('previous');
  });

  test('deletes a new record when the first write cannot be verified', async () => {
    const saved = memory();
    saved.mismatch();

    await expect(
      commitVerifiedRecord(saved.local, 'record', 'next', () => true, 'not verified'),
    ).rejects.toThrow('not verified');
    expect(saved.value()).toBeUndefined();
  });

  test('does not publish the new value when restoring the previous bytes fails', async () => {
    const saved = memory('previous');
    saved.failRestore();
    let shown = 'previous';

    await expect(
      commitVerifiedRecord(saved.local, 'record', 'next', () => false, 'not verified').then(() => {
        shown = 'next';
      }),
    ).rejects.toThrow('not verified');

    expect(shown).toBe('previous');
    expect(saved.value()).toBe('next');
  });
});

import {
  loadSavedSeries,
  loadViewingProgress,
  type ProgressEntry,
  serializeSavedSeries,
  serializeViewingProgress,
} from '@/domain/library';
import { type LocalStorage, MMKV_LIBRARY_KEY, MMKV_PROGRESS_KEY } from '@/storage/persistence';

export type PersistedLibrary =
  | { status: 'ready'; savedSeriesIds: string[]; entries: ProgressEntry[] }
  | { status: 'error'; reason: 'corrupt' | 'unreadable' };

export async function loadPersistedLibrary(local: LocalStorage): Promise<PersistedLibrary> {
  let savedRaw: string | undefined;
  let progressRaw: string | undefined;

  try {
    savedRaw = await local.getString(MMKV_LIBRARY_KEY);
    progressRaw = await local.getString(MMKV_PROGRESS_KEY);
  } catch {
    return { status: 'error', reason: 'unreadable' };
  }

  const saved = loadSavedSeries(savedRaw);
  const progress = loadViewingProgress(progressRaw);
  if (saved.status === 'corrupt' || progress.status === 'corrupt') {
    return { status: 'error', reason: 'corrupt' };
  }

  return {
    status: 'ready',
    savedSeriesIds: saved.status === 'ready' ? saved.savedSeriesIds : [],
    entries: progress.status === 'ready' ? progress.entries : [],
  };
}

export async function commitSavedSeries(
  local: LocalStorage,
  savedSeriesIds: readonly string[],
): Promise<void> {
  const payload = serializeSavedSeries(savedSeriesIds);
  await commitRecord(local, MMKV_LIBRARY_KEY, payload, (value) => {
    const loaded = loadSavedSeries(value);
    return loaded.status === 'ready' && sameIds(loaded.savedSeriesIds, savedSeriesIds);
  });
}

export async function commitViewingProgress(
  local: LocalStorage,
  entries: readonly ProgressEntry[],
): Promise<void> {
  const payload = serializeViewingProgress(entries);
  await commitRecord(local, MMKV_PROGRESS_KEY, payload, (value) => {
    const loaded = loadViewingProgress(value);
    return loaded.status === 'ready' && sameProgress(loaded.entries, entries);
  });
}

async function commitRecord(
  local: LocalStorage,
  key: string,
  payload: string,
  accept: (value: string) => boolean,
): Promise<void> {
  const previous = await local.getString(key);

  try {
    await local.setString(key, payload);
    const readBack = await local.getString(key);
    if (readBack !== payload || !accept(readBack)) {
      throw new Error('Library write could not be verified');
    }
  } catch (error) {
    await restoreKey(local, key, previous);
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Library write could not be verified');
  }
}

async function restoreKey(
  local: LocalStorage,
  key: string,
  previous: string | undefined,
): Promise<void> {
  try {
    if (previous === undefined) {
      await local.delete(key);
      return;
    }

    await local.setString(key, previous);
  } catch {
    // The visible library stays unchanged either way.
  }
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function sameProgress(left: readonly ProgressEntry[], right: readonly ProgressEntry[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.seriesId === right[index]?.seriesId &&
        entry.episode === right[index]?.episode &&
        entry.updatedAt === right[index]?.updatedAt,
    )
  );
}

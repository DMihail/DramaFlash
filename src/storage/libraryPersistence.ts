import {
  loadSavedSeries,
  loadViewingProgress,
  type ProgressEntry,
  serializeSavedSeries,
  serializeViewingProgress,
} from '@/domain/library';
import {
  commitVerifiedRecord,
  type LocalStorage,
  MMKV_LIBRARY_KEY,
  MMKV_PROGRESS_KEY,
} from '@/storage/persistence';

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
  await commitVerifiedRecord(
    local,
    MMKV_LIBRARY_KEY,
    payload,
    (value) => {
      const loaded = loadSavedSeries(value);
      return loaded.status === 'ready' && sameIds(loaded.savedSeriesIds, savedSeriesIds);
    },
    'Library write could not be verified',
  );
}

export async function commitViewingProgress(
  local: LocalStorage,
  entries: readonly ProgressEntry[],
): Promise<void> {
  const payload = serializeViewingProgress(entries);
  await commitVerifiedRecord(
    local,
    MMKV_PROGRESS_KEY,
    payload,
    (value) => {
      const loaded = loadViewingProgress(value);
      return loaded.status === 'ready' && sameProgress(loaded.entries, entries);
    },
    'Library write could not be verified',
  );
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

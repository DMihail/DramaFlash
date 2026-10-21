import { findSeries } from '@/data/catalog';
import { isEpisodeUnlocked, type Wallet } from '@/domain/wallet';

export const LIBRARY_SCHEMA_VERSION = 1;
export const PROGRESS_SCHEMA_VERSION = 1;

export type ProgressEntry = {
  seriesId: string;
  episode: number;
  updatedAt: number;
};

export type SavedLibraryResult =
  { status: 'empty' } | { status: 'ready'; savedSeriesIds: string[] } | { status: 'corrupt' };

export type ProgressLoadResult =
  { status: 'empty' } | { status: 'ready'; entries: ProgressEntry[] } | { status: 'corrupt' };

export function emptySavedIds(): string[] {
  return [];
}

export function toggleSeriesId(ids: readonly string[], seriesId: string): string[] {
  if (ids.includes(seriesId)) {
    return ids.filter((id) => id !== seriesId);
  }

  return [...ids, seriesId];
}

export function visibleSavedIds(ids: readonly string[]): string[] {
  return ids.filter((id) => findSeries(id) !== undefined);
}

export function loadSavedSeries(raw: string | undefined): SavedLibraryResult {
  if (raw === undefined) {
    return { status: 'empty' };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isSavedRecord(value)) {
      return { status: 'corrupt' };
    }

    return { status: 'ready', savedSeriesIds: uniqueIds(value.savedSeriesIds) };
  } catch {
    return { status: 'corrupt' };
  }
}

export function serializeSavedSeries(savedSeriesIds: readonly string[]): string {
  return JSON.stringify({
    version: LIBRARY_SCHEMA_VERSION,
    savedSeriesIds,
  });
}

export function recordOpenedEpisode(
  entries: readonly ProgressEntry[],
  seriesId: string,
  episode: number,
  updatedAt: number,
  wallet: Wallet,
): ProgressEntry[] | null {
  if (!isEpisodeUnlocked(wallet, seriesId, episode)) {
    return null;
  }

  if (!Number.isFinite(updatedAt) || updatedAt < 0) {
    return null;
  }

  return [
    ...entries.filter((entry) => entry.seriesId !== seriesId),
    { seriesId, episode, updatedAt },
  ];
}

export function continueWatchingEntries(
  entries: readonly ProgressEntry[],
  wallet: Wallet,
): ProgressEntry[] {
  return entries
    .filter((entry) => isEpisodeUnlocked(wallet, entry.seriesId, entry.episode))
    .sort(
      (left, right) =>
        right.updatedAt - left.updatedAt || left.seriesId.localeCompare(right.seriesId),
    );
}

export function loadViewingProgress(raw: string | undefined): ProgressLoadResult {
  if (raw === undefined) {
    return { status: 'empty' };
  }

  try {
    const value: unknown = JSON.parse(raw);
    if (!isProgressRecord(value)) {
      return { status: 'corrupt' };
    }

    return { status: 'ready', entries: collapseEntries(value.entries) };
  } catch {
    return { status: 'corrupt' };
  }
}

export function serializeViewingProgress(entries: readonly ProgressEntry[]): string {
  return JSON.stringify({
    version: PROGRESS_SCHEMA_VERSION,
    entries,
  });
}

function uniqueIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    next.push(id);
  }

  return next;
}

function collapseEntries(entries: readonly ProgressEntry[]): ProgressEntry[] {
  const bySeries = new Map<string, ProgressEntry>();

  for (const entry of entries) {
    const current = bySeries.get(entry.seriesId);
    if (!current || entry.updatedAt >= current.updatedAt) {
      bySeries.set(entry.seriesId, entry);
    }
  }

  return [...bySeries.values()];
}

function isSavedRecord(value: unknown): value is { savedSeriesIds: string[] } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { version?: unknown; savedSeriesIds?: unknown };
  return (
    record.version === LIBRARY_SCHEMA_VERSION &&
    Array.isArray(record.savedSeriesIds) &&
    record.savedSeriesIds.every((id) => typeof id === 'string' && id.length > 0)
  );
}

function isProgressRecord(value: unknown): value is { entries: ProgressEntry[] } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { version?: unknown; entries?: unknown };
  return (
    record.version === PROGRESS_SCHEMA_VERSION &&
    Array.isArray(record.entries) &&
    record.entries.every((entry) => isProgressEntry(entry))
  );
}

function isProgressEntry(value: unknown): value is ProgressEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as { seriesId?: unknown; episode?: unknown; updatedAt?: unknown };
  return (
    typeof record.seriesId === 'string' &&
    record.seriesId.length > 0 &&
    typeof record.episode === 'number' &&
    Number.isInteger(record.episode) &&
    record.episode >= 1 &&
    typeof record.updatedAt === 'number' &&
    Number.isFinite(record.updatedAt) &&
    record.updatedAt >= 0
  );
}

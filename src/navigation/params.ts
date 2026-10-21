import { LAST_EPISODE } from '@/domain/wallet';

export function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  return raw;
}

export function parseEpisodeNumber(value: string | string[] | undefined): number {
  const raw = readParam(value);
  if (!raw) {
    return 1;
  }

  const episode = Number(raw);
  if (!Number.isInteger(episode) || episode < 1 || episode > LAST_EPISODE) {
    return 1;
  }

  return episode;
}

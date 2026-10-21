export function readParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  return raw;
}

export function parseEpisodeNumber(
  value: string | string[] | undefined,
  episodeCount: number | null,
): number {
  const raw = readParam(value);
  if (!raw) {
    return 1;
  }

  const episode = Number(raw);
  if (
    episodeCount === null ||
    !Number.isInteger(episode) ||
    episode < 1 ||
    episode > episodeCount
  ) {
    return 1;
  }

  return episode;
}

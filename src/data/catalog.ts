export type Series = {
  id: string;
  title: string;
  episodeCount: number | null;
  poster?: number;
};

export const catalog = [
  { id: 'the-ceo-and-i', title: 'The CEO and I', episodeCount: 50 },
  { id: 'my-secret-life', title: 'My Secret Life', episodeCount: 30 },
  { id: 'love-on-detours', title: 'Love on Detours', episodeCount: 65 },
  { id: 'bloody-roses', title: 'Bloody Roses', episodeCount: 80 },
  { id: 'shadow-kiss', title: 'Shadow Kiss', episodeCount: 45 },
  { id: 'dark-desire', title: 'Dark Desire', episodeCount: 60 },
  { id: 'avenging-angel', title: 'Avenging Angel', episodeCount: 90 },
  { id: 'band-of-fate', title: 'Band of Fate', episodeCount: 25 },
  { id: 'second-chance', title: 'Second Chance', episodeCount: 55 },
  { id: 'forbidden-vows', title: 'Forbidden Vows', episodeCount: 48 },
  { id: 'love-in-the-fast-lane', title: 'Love in the Fast Lane', episodeCount: 60 },
  { id: 'the-heirs-dilemma', title: "The Heir's Dilemma", episodeCount: 45 },
] as const satisfies readonly Series[];

export type SeriesId = (typeof catalog)[number]['id'];

export function findSeries(id: string): Series | undefined {
  return catalog.find((series) => series.id === id);
}

export function episodeCountFor(seriesId: string): number | null {
  const episodeCount = findSeries(seriesId)?.episodeCount ?? null;
  if (episodeCount === null || !Number.isInteger(episodeCount) || episodeCount < 1) {
    return null;
  }

  return episodeCount;
}

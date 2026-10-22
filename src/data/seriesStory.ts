/**
 * Copy read from the series-detail frame for one catalog series.
 *
 * The board paints this story as “The CEO’s Secret Life”. The catalog title
 * stays “The CEO and I”. Other series do not get this text.
 */

export const storySeriesId = 'the-ceo-and-i';

export const storySynopsis =
  "When a struggling artist accidentally discovers that the ruthless CEO of the city's largest conglomerate is actually her anonymous online confidant, her life is turned upside down. Can their digital romance survive the harsh reality of corporate espionage and forbidden love?";

export const storyHighlights = [
  'Intense chemistry from the very first frame.',
  'A gripping double-life narrative with high stakes.',
] as const;

export const storyCast = [
  { id: 'elena', name: 'Elena', role: 'Mia (Artist)' },
  { id: 'julian-vance', name: 'Julian Vance', role: 'Alexander (CEO)' },
  // The board clips this role after "Chloe (Best", so only Chloe is shown.
  { id: 'sarah-lin', name: 'Sarah Lin', role: 'Chloe' },
  { id: 'marcus', name: 'Marcus', role: 'Rival CEO' },
] as const;

export type StoryCastId = (typeof storyCast)[number]['id'];

const episodeTitles: Readonly<Record<number, string>> = {
  1: 'The Accidental Message',
  2: 'Coffee and Contracts',
  3: 'A Glimpse Behind the Mask',
  4: 'The Gala Encounter',
  5: 'Misunderstandings',
  6: 'Midnight Confessions',
};

export const storyLoveTitle = "Why you'll love it";
export const seasonUnlockTitle = 'Unlock full season';
export const seasonUnlockNote = 'Season unlock is not available in this demo.';

export function hasSeriesStory(seriesId: string): boolean {
  return seriesId === storySeriesId;
}

export function storyEpisodeTitle(seriesId: string, episode: number): string {
  if (seriesId !== storySeriesId) {
    return `Episode ${episode}`;
  }

  return episodeTitles[episode] ?? `Episode ${episode}`;
}

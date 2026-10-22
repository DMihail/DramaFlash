import {
  hasSeriesStory,
  seasonUnlockNote,
  storyEpisodeTitle,
  storySeriesId,
} from '@/data/seriesStory';
import { episodeStill } from '@/features/home/assets';

describe('series story copy', () => {
  test('keeps the board titles on the CEO series only', () => {
    expect(hasSeriesStory(storySeriesId)).toBe(true);
    expect(hasSeriesStory('shadow-kiss')).toBe(false);
    expect(storyEpisodeTitle(storySeriesId, 1)).toBe('The Accidental Message');
    expect(storyEpisodeTitle(storySeriesId, 6)).toBe('Midnight Confessions');
    expect(storyEpisodeTitle(storySeriesId, 7)).toBe('Episode 7');
    expect(storyEpisodeTitle('shadow-kiss', 1)).toBe('Episode 1');
    expect(episodeStill(storySeriesId, 1)).toBeTruthy();
    expect(episodeStill(storySeriesId, 7)).toBeUndefined();
    expect(episodeStill('shadow-kiss', 1)).toBeUndefined();
    expect(seasonUnlockNote).toContain('not available');
  });
});

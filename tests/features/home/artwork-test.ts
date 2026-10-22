import { homeHeroArt, posterArt, seriesHeroArt } from '@/features/home/assets';

describe('board artwork', () => {
  test('keeps a poster for every catalog id and a separate home still', () => {
    expect(homeHeroArt).toBeTruthy();
    expect(posterArt('the-ceo-and-i')).toBeTruthy();
    expect(seriesHeroArt('the-ceo-and-i')).toBeTruthy();
    expect(seriesHeroArt('the-ceo-and-i')).not.toBe(posterArt('the-ceo-and-i'));
    expect(seriesHeroArt('shadow-kiss')).toBe(posterArt('shadow-kiss'));
    expect(seriesHeroArt('missing-series')).toBeUndefined();
    expect(homeHeroArt).not.toBe(posterArt('the-ceo-and-i'));
  });
});

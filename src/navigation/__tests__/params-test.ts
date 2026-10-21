import { catalog, findSeries } from '@/data/catalog';
import { parseEpisodeNumber } from '@/navigation/params';

describe('catalog and route params', () => {
  test('uses one stable id per series', () => {
    const ids = catalog.map((series) => series.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(findSeries('the-ceo-and-i')?.title).toBe('The CEO and I');
    expect(findSeries('missing')).toBeUndefined();
  });

  test('falls back to episode 1 when the number is missing or invalid', () => {
    expect(parseEpisodeNumber(undefined)).toBe(1);
    expect(parseEpisodeNumber('4')).toBe(4);
    expect(parseEpisodeNumber('0')).toBe(1);
    expect(parseEpisodeNumber('46')).toBe(1);
    expect(parseEpisodeNumber('nope')).toBe(1);
    expect(parseEpisodeNumber(['12', '3'])).toBe(12);
  });
});

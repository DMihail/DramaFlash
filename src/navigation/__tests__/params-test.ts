import { catalog, findSeries } from '@/data/catalog';
import { parseEpisodeNumber } from '@/navigation/params';

describe('catalog and route params', () => {
  test('uses one stable id per series', () => {
    const ids = catalog.map((series) => series.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(findSeries('the-ceo-and-i')?.title).toBe('The CEO and I');
    expect(findSeries('missing')).toBeUndefined();
  });

  test('falls back to episode 1 when the number is missing or outside the series', () => {
    expect(parseEpisodeNumber(undefined, 50)).toBe(1);
    expect(parseEpisodeNumber('4', 50)).toBe(4);
    expect(parseEpisodeNumber('50', 50)).toBe(50);
    expect(parseEpisodeNumber('51', 50)).toBe(1);
    expect(parseEpisodeNumber('25', 25)).toBe(25);
    expect(parseEpisodeNumber('26', 25)).toBe(1);
    expect(parseEpisodeNumber('45', 45)).toBe(45);
    expect(parseEpisodeNumber('46', 45)).toBe(1);
    expect(parseEpisodeNumber('90', 90)).toBe(90);
    expect(parseEpisodeNumber('91', 90)).toBe(1);
    expect(parseEpisodeNumber('4', null)).toBe(1);
    expect(parseEpisodeNumber('0', 90)).toBe(1);
    expect(parseEpisodeNumber('nope', 50)).toBe(1);
    expect(parseEpisodeNumber(['12', '3'], 50)).toBe(12);
  });
});

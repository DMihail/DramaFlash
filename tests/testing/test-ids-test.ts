import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { testIds } from '@/testing/testIds';

const flowDirectory = path.join(__dirname, '../e2e/maestro');

function staticTestIds(value: object): string[] {
  const found: string[] = [];

  for (const item of Object.values(value)) {
    if (typeof item === 'string') {
      found.push(item);
      continue;
    }

    if (item && typeof item === 'object') {
      found.push(...staticTestIds(item));
    }
  }

  return found;
}

function maestroIds(): string[] {
  const ids: string[] = [];

  for (const file of readdirSync(flowDirectory)) {
    if (!file.endsWith('.yaml')) {
      continue;
    }

    const source = readFileSync(path.join(flowDirectory, file), 'utf8');
    for (const match of source.matchAll(/^\s*id:\s*(\S+)/gm)) {
      const id = match[1];
      if (id) {
        ids.push(id);
      }
    }
  }

  return ids;
}

describe('test id registry', () => {
  test('builds stable series and episode ids', () => {
    expect(testIds.home.poster('the-ceo-and-i')).toBe('home.poster.the-ceo-and-i');
    expect(testIds.home.poster('band-of-fate')).toBe('home.poster.band-of-fate');
    expect(testIds.home.genre('Romance')).toBe('home.genre.romance');
    expect(testIds.home.seeAll('trending-romance')).toBe('home.seeAll.trending-romance');
    expect(testIds.series.episode(1)).toBe('series.episode.1');
    expect(testIds.series.episode(4)).toBe('series.episode.4');
    expect(testIds.series.episode(1)).not.toBe(testIds.series.episode(4));
  });

  test('keeps static ids unique', () => {
    const ids = staticTestIds(testIds);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('matches every Maestro selector to the registry', () => {
    const known = new Set<string>([
      ...staticTestIds(testIds),
      testIds.home.poster('the-ceo-and-i'),
      testIds.series.episode(1),
      testIds.series.episode(4),
    ]);
    const selectors = maestroIds();

    expect(selectors.length).toBeGreaterThan(0);

    for (const id of selectors) {
      expect(known.has(id)).toBe(true);
    }

    expect(selectors).toEqual(
      expect.arrayContaining([
        testIds.home.screen,
        testIds.home.poster('the-ceo-and-i'),
        testIds.series.screen,
        testIds.series.title,
        testIds.series.episode(1),
        testIds.series.episode(4),
        testIds.player.screen,
        testIds.player.episode,
        testIds.player.next,
        testIds.player.locked,
        testIds.player.unlock,
        testIds.player.play,
        testIds.coins.store,
      ]),
    );
  });
});

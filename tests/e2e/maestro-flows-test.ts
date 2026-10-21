import { readFileSync } from 'node:fs';
import path from 'node:path';

import { testIds } from '@/testing/testIds';

const flowDirectory = path.join(__dirname, 'maestro');

const flows = [
  {
    file: 'home-to-series.yaml',
    ids: [
      testIds.home.screen,
      testIds.home.poster('the-ceo-and-i'),
      testIds.series.screen,
      testIds.series.title,
    ],
  },
  {
    file: 'episode-navigation.yaml',
    ids: [
      testIds.series.episode(1),
      testIds.player.screen,
      testIds.player.episode,
      testIds.player.next,
    ],
  },
  {
    file: 'locked-episode.yaml',
    ids: [
      testIds.series.episode(4),
      testIds.player.locked,
      testIds.player.unlock,
      testIds.player.play,
    ],
  },
] as const;

describe('maestro flows', () => {
  test('target the development app and stable test IDs', () => {
    for (const flow of flows) {
      const source = readFileSync(path.join(flowDirectory, flow.file), 'utf8');

      expect(source.startsWith('appId: com.dramaflash.app.dev\n')).toBe(true);
      expect(source).not.toMatch(/com\.dramaflash\.app(?!\.dev)/);
      expect(source).toContain('clearState: false');
      expect(source).not.toContain('sleep');

      for (const id of flow.ids) {
        expect(source).toContain(`id: ${id}`);
      }
    }
  });

  test('asserts the locked player message instead of the series coin label', () => {
    const source = readFileSync(path.join(flowDirectory, 'locked-episode.yaml'), 'utf8');
    const playerMessage =
      'Episode 4 is locked. It costs 10 coins. Opening unlock does not charge coins.';

    expect(source).toContain(playerMessage);
    expect(source).not.toMatch(/^\s*text:\s*10 coins\s*$/m);
  });
});

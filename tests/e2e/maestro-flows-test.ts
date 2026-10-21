import { readFileSync } from 'node:fs';
import path from 'node:path';

const flowDirectory = path.join(__dirname, 'maestro');

const flows = [
  {
    file: 'home-to-series.yaml',
    ids: ['home.screen', 'home.poster.the-ceo-and-i', 'series.screen', 'series.title'],
  },
  {
    file: 'episode-navigation.yaml',
    ids: ['series.episode.1', 'player.screen', 'player.episode', 'player.next'],
  },
  {
    file: 'locked-episode.yaml',
    ids: ['series.episode.4', 'player.locked', 'player.unlock', 'player.play'],
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
});

import { MockRequestAborted } from '@/api/mockRequest';
import { loadPlayerEpisode } from '@/api/player';

const immediate = { delayMs: 0 } as const;

describe('player mock API', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns the selected series and episode', async () => {
    const result = await loadPlayerEpisode('the-ceo-and-i', 4, immediate);

    expect(result).toEqual({
      status: 'success',
      data: {
        series: { id: 'the-ceo-and-i', title: 'The CEO and I', episodeCount: 50 },
        episode: 4,
        media: 'artwork',
      },
    });
  });

  test('returns not-found, out-of-range, and unavailable media', async () => {
    await expect(loadPlayerEpisode('missing', 1, immediate)).resolves.toEqual({
      status: 'not-found',
    });
    await expect(loadPlayerEpisode('the-ceo-and-i', 51, immediate)).resolves.toEqual({
      status: 'out-of-range',
    });
    await expect(loadPlayerEpisode('the-ceo-and-i', 0, immediate)).resolves.toEqual({
      status: 'out-of-range',
    });
    await expect(
      loadPlayerEpisode('my-secret-life', 2, { ...immediate, media: 'unavailable' }),
    ).resolves.toMatchObject({
      status: 'success',
      data: { episode: 2, media: 'unavailable' },
    });
  });

  test('rejects a cancelled request and can fail', async () => {
    const controller = new AbortController();
    const pending = loadPlayerEpisode('the-ceo-and-i', 1, {
      delayMs: 400,
      signal: controller.signal,
    });
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(MockRequestAborted);
    await expect(
      loadPlayerEpisode('the-ceo-and-i', 1, { ...immediate, fail: true }),
    ).rejects.toThrow('The series could not be loaded.');
  });
});

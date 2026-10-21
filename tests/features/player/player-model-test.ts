import { findSeries } from '@/data/catalog';
import { freshWallet, unlockEpisode } from '@/domain/wallet';
import {
  adjacentEpisode,
  canPreviewPlayback,
  lockedEpisodeMessage,
  playbackLabel,
  playerAccess,
  previewFor,
  requestedEpisode,
  shouldApplyPlayerResult,
  unlockDestination,
} from '@/features/player/model';

describe('player episode rules', () => {
  const ceo = findSeries('the-ceo-and-i');

  test('keeps the requested episode inside the series', () => {
    expect(requestedEpisode(undefined)).toBe(1);
    expect(requestedEpisode('')).toBe(1);
    expect(requestedEpisode('4')).toBe(4);
    expect(requestedEpisode('50')).toBe(50);
    expect(requestedEpisode('nope')).toBeNull();
    expect(requestedEpisode('1.5')).toBeNull();
    expect(adjacentEpisode(1, 50, -1)).toBeNull();
    expect(adjacentEpisode(1, 50, 1)).toBe(2);
    expect(adjacentEpisode(50, 50, 1)).toBeNull();
    expect(adjacentEpisode(49, 50, 1)).toBe(50);
    expect(adjacentEpisode(4, null, 1)).toBeNull();
  });

  test('treats episodes 1 to 3 as free and later episodes as locked until the wallet unlocks them', () => {
    const wallet = freshWallet();

    expect(playerAccess(undefined, 'the-ceo-and-i', 1, 50)).toBe('free');
    expect(playerAccess(wallet, 'the-ceo-and-i', 3, 50)).toBe('free');
    expect(playerAccess(wallet, 'the-ceo-and-i', 4, 50)).toBe('locked');
    expect(playerAccess(unlockEpisode(wallet, 'the-ceo-and-i', 4), 'the-ceo-and-i', 4, 50)).toBe(
      'unlocked',
    );
    expect(playerAccess(wallet, 'my-secret-life', 4, 30)).toBe('locked');
    expect(lockedEpisodeMessage(4)).toContain('10 coins');
    expect(lockedEpisodeMessage(4)).toContain('does not charge coins');
  });

  test('plays an artwork preview only for an open episode', () => {
    expect(ceo).toBeDefined();
    if (!ceo) {
      return;
    }

    expect(previewFor({ series: ceo, episode: 1, media: 'artwork' }, true)).toBe('artwork');
    expect(previewFor({ series: ceo, episode: 1, media: 'artwork' }, false)).toBe('unavailable');
    expect(previewFor({ series: ceo, episode: 1, media: 'unavailable' }, true)).toBe('unavailable');
    expect(canPreviewPlayback('free', 'artwork')).toBe(true);
    expect(canPreviewPlayback('unlocked', 'artwork')).toBe(true);
    expect(canPreviewPlayback('locked', 'artwork')).toBe(false);
    expect(canPreviewPlayback('free', 'unavailable')).toBe(false);
    expect(playbackLabel(true)).toBe('Playing artwork preview');
    expect(playbackLabel(false)).toBe('Paused artwork preview');
  });

  test('ignores a result from an older episode request', () => {
    const current = { seriesId: 'the-ceo-and-i', episode: 2, attempt: 1 };

    expect(
      shouldApplyPlayerResult(
        { seriesId: 'the-ceo-and-i', episode: 2, attempt: 1 },
        current,
        false,
      ),
    ).toBe(true);
    expect(
      shouldApplyPlayerResult(
        { seriesId: 'the-ceo-and-i', episode: 1, attempt: 1 },
        current,
        false,
      ),
    ).toBe(false);
    expect(
      shouldApplyPlayerResult({ seriesId: 'the-ceo-and-i', episode: 2, attempt: 1 }, current, true),
    ).toBe(false);
  });

  test('opens the coin store without marking the episode unlocked', () => {
    expect(unlockDestination('the-ceo-and-i', 4)).toEqual({
      pathname: '/coins',
      params: { seriesId: 'the-ceo-and-i', episode: '4' },
    });
  });
});

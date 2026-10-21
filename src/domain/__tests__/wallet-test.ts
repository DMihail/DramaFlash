import { episodeCountFor } from '@/data/catalog';
import {
  STARTING_BALANCE,
  WALLET_STORAGE_KEY,
  coinPacks,
  freshWallet,
  isEpisodeInSeries,
  isEpisodeUnlocked,
  loadWallet,
  purchaseCoins,
  unlockEpisode,
} from '@/domain/wallet';

const seriesA = 'the-ceo-and-i';
const seriesB = 'my-secret-life';

describe('wallet', () => {
  test('starts with 15 coins and unlocks episode 4 once', () => {
    const initial = freshWallet();
    expect(initial).toEqual({ balance: STARTING_BALANCE, unlocks: [] });
    expect(isEpisodeUnlocked(initial, seriesA, 4)).toBe(false);

    const unlocked = unlockEpisode(initial, seriesA, 4);

    expect(unlocked.balance).toBe(5);
    expect(isEpisodeUnlocked(unlocked, seriesA, 4)).toBe(true);
    expect(unlockEpisode(unlocked, seriesA, 4)).toBe(unlocked);

    const stored = new Map([[WALLET_STORAGE_KEY, JSON.stringify(unlocked)]]);
    const restored = loadWallet({ getItem: (key) => stored.get(key) ?? null });

    expect(restored).toEqual(unlocked);
    expect(unlockEpisode(restored, seriesA, 4)).toBe(restored);
  });

  test('does not unlock the same episode on another series', () => {
    const unlocked = unlockEpisode(freshWallet(), seriesA, 4);

    expect(isEpisodeUnlocked(unlocked, seriesB, 4)).toBe(false);
    expect(unlockEpisode(unlocked, seriesB, 4)).toBe(unlocked);

    const paid = purchaseCoins(unlocked, 0);
    const otherSeries = unlockEpisode(paid, seriesB, 4);

    expect(otherSeries.balance).toBe(295);
    expect(isEpisodeUnlocked(otherSeries, seriesA, 4)).toBe(true);
    expect(isEpisodeUnlocked(otherSeries, seriesB, 4)).toBe(true);
  });

  test('a coin pack does not unlock the next episode', () => {
    const low = unlockEpisode(freshWallet(), seriesA, 4);
    expect(unlockEpisode(low, seriesA, 5)).toBe(low);

    const purchased = purchaseCoins(low, 0);

    expect(purchased.balance).toBe(305);
    expect(purchased.unlocks).toEqual([{ seriesId: seriesA, episode: 4 }]);
    expect(isEpisodeUnlocked(purchased, seriesA, 5)).toBe(false);

    const confirmed = unlockEpisode(purchased, seriesA, 5);

    expect(confirmed.balance).toBe(295);
    expect(confirmed.unlocks).toEqual([
      { seriesId: seriesA, episode: 4 },
      { seriesId: seriesA, episode: 5 },
    ]);
    expect(unlockEpisode(confirmed, seriesA, 5)).toBe(confirmed);
  });

  test('adds each pack without changing unlocks', () => {
    for (const [index, pack] of coinPacks.entries()) {
      const wallet = purchaseCoins(freshWallet(), index);

      expect(wallet.balance).toBe(STARTING_BALANCE + pack.coins + pack.bonus);
      expect(wallet.unlocks).toEqual([]);
    }
  });

  test('does not charge for free, invalid, or unknown purchases', () => {
    const wallet = freshWallet();

    for (const episode of [1, 2, 3, 0, -1, 51, 4.5, Number.NaN]) {
      expect(unlockEpisode(wallet, seriesA, episode)).toBe(wallet);
    }

    expect(unlockEpisode(wallet, '', 4)).toBe(wallet);
    expect(unlockEpisode(wallet, 'missing-series', 4)).toBe(wallet);
    expect(isEpisodeInSeries(null, 4)).toBe(false);
    expect(isEpisodeUnlocked(wallet, 'missing-series', 1)).toBe(false);
    expect(purchaseCoins(wallet, -1)).toBe(wallet);
    expect(purchaseCoins(wallet, coinPacks.length)).toBe(wallet);
  });

  test('uses the selected series length for episodes 25, 45, 50, and 90', () => {
    const lengths = [
      ['band-of-fate', 25],
      ['shadow-kiss', 45],
      ['the-ceo-and-i', 50],
      ['avenging-angel', 90],
    ] as const;
    const funded = purchaseCoins(freshWallet(), 0);

    for (const [seriesId, episodeCount] of lengths) {
      expect(episodeCountFor(seriesId)).toBe(episodeCount);
      expect(isEpisodeUnlocked(freshWallet(), seriesId, 1)).toBe(true);
      expect(isEpisodeUnlocked(freshWallet(), seriesId, 3)).toBe(true);
      expect(isEpisodeUnlocked(funded, seriesId, episodeCount)).toBe(false);

      const unlocked = unlockEpisode(funded, seriesId, episodeCount);
      const pastTheEnd = unlockEpisode(funded, seriesId, episodeCount + 1);

      expect(unlocked.balance).toBe(funded.balance - 10);
      expect(unlocked.unlocks).toEqual([{ seriesId, episode: episodeCount }]);
      expect(pastTheEnd).toBe(funded);

      const stored = JSON.stringify({
        balance: STARTING_BALANCE,
        unlocks: [{ seriesId, episode: episodeCount }],
      });
      const tooFar = JSON.stringify({
        balance: STARTING_BALANCE,
        unlocks: [{ seriesId, episode: episodeCount + 1 }],
      });

      expect(loadWallet({ getItem: () => stored }).unlocks).toEqual([
        { seriesId, episode: episodeCount },
      ]);
      expect(loadWallet({ getItem: () => tooFar })).toEqual(freshWallet());
    }
  });

  test('recovers from missing or bad storage', () => {
    for (const value of [
      null,
      '{',
      'null',
      '{"balance":-1,"unlocks":[]}',
      '{"balance":15,"unlocks":[{"seriesId":"the-ceo-and-i","episode":99}]}',
      '{"balance":15,"unlocks":[{"seriesId":"missing-series","episode":4}]}',
      '{"balance":15,"unlockedEpisodes":[4]}',
    ]) {
      expect(loadWallet({ getItem: () => value })).toEqual(freshWallet());
    }

    expect(
      loadWallet({
        getItem: () => {
          throw new Error('Unavailable');
        },
      }),
    ).toEqual(freshWallet());
  });
});

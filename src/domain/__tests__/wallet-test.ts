import {
  LAST_EPISODE,
  STARTING_BALANCE,
  WALLET_STORAGE_KEY,
  coinPacks,
  freshWallet,
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

    for (const episode of [1, 2, 3, 0, -1, LAST_EPISODE + 1, 4.5, Number.NaN]) {
      expect(unlockEpisode(wallet, seriesA, episode)).toBe(wallet);
    }

    expect(unlockEpisode(wallet, '', 4)).toBe(wallet);
    expect(purchaseCoins(wallet, -1)).toBe(wallet);
    expect(purchaseCoins(wallet, coinPacks.length)).toBe(wallet);
  });

  test('recovers from missing or bad storage', () => {
    for (const value of [
      null,
      '{',
      'null',
      '{"balance":-1,"unlocks":[]}',
      '{"balance":15,"unlocks":[{"seriesId":"the-ceo-and-i","episode":99}]}',
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

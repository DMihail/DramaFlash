import { episodeCountFor } from '@/data/catalog';
import {
  coinPacks,
  confirmUnlock,
  freshWallet,
  grantCoinPack,
  isEpisodeInSeries,
  isEpisodeUnlocked,
  parseWallet,
  serializeWallet,
  STARTING_BALANCE,
  unlockEpisode,
  type Wallet,
  WALLET_SCHEMA_VERSION,
} from '@/domain/wallet';

function readyWallet(raw: string) {
  const wallet = parseWallet(raw);
  if (!wallet) {
    throw new Error('expected a saved wallet');
  }

  return wallet;
}

function withPack(wallet: Wallet, packId: string): Wallet {
  const next = grantCoinPack(wallet, packId);
  if (!next) {
    throw new Error(`expected coin pack ${packId}`);
  }

  return next;
}

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

    const restored = readyWallet(JSON.stringify(unlocked));

    expect(restored).toEqual(unlocked);
    expect(unlockEpisode(restored, seriesA, 4)).toBe(restored);
  });

  test('does not unlock the same episode on another series', () => {
    const unlocked = unlockEpisode(freshWallet(), seriesA, 4);

    expect(isEpisodeUnlocked(unlocked, seriesB, 4)).toBe(false);
    expect(unlockEpisode(unlocked, seriesB, 4)).toBe(unlocked);

    const paid = withPack(unlocked, 'coins-300');
    const otherSeries = unlockEpisode(paid, seriesB, 4);

    expect(otherSeries.balance).toBe(295);
    expect(isEpisodeUnlocked(otherSeries, seriesA, 4)).toBe(true);
    expect(isEpisodeUnlocked(otherSeries, seriesB, 4)).toBe(true);
  });

  test('a coin pack does not unlock the next episode', () => {
    const low = unlockEpisode(freshWallet(), seriesA, 4);
    expect(unlockEpisode(low, seriesA, 5)).toBe(low);

    const purchased = withPack(low, 'coins-300');

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
    for (const pack of coinPacks) {
      const wallet = withPack(freshWallet(), pack.id);

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
    expect(grantCoinPack(wallet, '')).toBeNull();
    expect(grantCoinPack(wallet, 'coins-999')).toBeNull();
  });

  test('uses the selected series length for episodes 25, 45, 50, and 90', () => {
    const lengths = [
      ['band-of-fate', 25],
      ['shadow-kiss', 45],
      ['the-ceo-and-i', 50],
      ['avenging-angel', 90],
    ] as const;
    const funded = withPack(freshWallet(), 'coins-300');

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

      expect(readyWallet(stored).unlocks).toEqual([{ seriesId, episode: episodeCount }]);
      expect(parseWallet(tooFar)).toBeNull();
    }
  });

  test('rejects corrupt or incompatible wallet records', () => {
    for (const value of [
      '',
      '{',
      'null',
      '{"balance":-1,"unlocks":[]}',
      '{"balance":15.5,"unlocks":[]}',
      '{"version":2,"balance":15,"unlocks":[]}',
      '{"balance":15,"unlocks":[{"seriesId":"the-ceo-and-i","episode":99}]}',
      '{"balance":15,"unlocks":[{"seriesId":"missing-series","episode":4}]}',
      '{"balance":15,"unlockedEpisodes":[4]}',
    ]) {
      expect(parseWallet(value)).toBeNull();
    }
  });

  test('saves a versioned wallet and does not charge a free or repeat unlock', () => {
    const stored = JSON.parse(serializeWallet(freshWallet())) as {
      version: number;
      balance: number;
    };

    expect(stored.version).toBe(WALLET_SCHEMA_VERSION);
    expect(stored.balance).toBe(STARTING_BALANCE);
    expect(readyWallet(serializeWallet(freshWallet()))).toEqual(freshWallet());

    const wallet = freshWallet();
    expect(confirmUnlock(wallet, seriesA, 1)).toEqual({ type: 'already-open', wallet });
    expect(confirmUnlock(wallet, seriesA, 3)).toEqual({ type: 'already-open', wallet });
    expect(confirmUnlock(wallet, seriesA, 0).type).toBe('rejected');
    expect(confirmUnlock(wallet, seriesA, 51).type).toBe('rejected');
    expect(confirmUnlock(wallet, 'missing-series', 4).type).toBe('rejected');

    const unlocked = confirmUnlock(wallet, seriesA, 4);
    if (unlocked.type !== 'unlocked') {
      throw new Error('expected the unlock');
    }

    expect(unlocked.wallet.balance).toBe(5);
    expect(confirmUnlock(unlocked.wallet, seriesA, 4)).toEqual({
      type: 'already-open',
      wallet: unlocked.wallet,
    });
    expect(confirmUnlock({ balance: 5, unlocks: [] }, seriesA, 5)).toEqual({
      type: 'insufficient',
      wallet: { balance: 5, unlocks: [] },
    });
    expect(grantCoinPack(wallet, 'coins-800')?.balance).toBe(STARTING_BALANCE + 850);
    expect(grantCoinPack(wallet, 'missing-pack')).toBeNull();
  });
});

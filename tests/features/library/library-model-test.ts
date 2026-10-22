import { freshWallet } from '@/domain/wallet';
import { purchaseLines, savedProgressLabel } from '@/features/library/model';

describe('library progress and purchases', () => {
  test('reads unlocks from the wallet and progress from continue watching', () => {
    const wallet = {
      balance: 100,
      unlocks: [
        { seriesId: 'the-ceo-and-i', episode: 4 },
        { seriesId: 'shadow-kiss', episode: 5 },
        { seriesId: 'missing-series', episode: 2 },
      ],
    };

    expect(purchaseLines(wallet)).toEqual([
      { seriesId: 'shadow-kiss', title: 'Shadow Kiss', episodes: [5] },
      { seriesId: 'the-ceo-and-i', title: 'The CEO and I', episodes: [4] },
    ]);
    expect(purchaseLines(freshWallet())).toEqual([]);
    expect(
      savedProgressLabel(
        'love-on-detours',
        65,
        [{ seriesId: 'love-on-detours', title: 'Love on Detours', episode: 2, meta: 'Episode 2' }],
      ),
    ).toBe('Ep 2 / 65');
    expect(savedProgressLabel('love-on-detours', 65, [])).toBe('65 Eps');
  });
});

import {
  coinPackColumns,
  contentWidth,
  discoverColumnCount,
  homeHeroFrame,
  navigationPlacement,
  posterFrame,
  seriesHeroFrame,
  storageKind,
  windowTier,
} from '@/theme/responsive';

const widths = [360, 390, 768, 1024, 1280, 1440, 1920];

describe('responsive layout', () => {
  test('keeps phone layouts full width and desktop layouts centered', () => {
    expect(widths.map((width) => windowTier(width))).toEqual([
      'phone',
      'phone',
      'tablet',
      'desktop',
      'desktop',
      'desktop',
      'desktop',
    ]);
    expect(contentWidth(360)).toBe(360);
    expect(contentWidth(1920)).toBe(1120);
    expect(navigationPlacement(390, 'web')).toBe('bottom');
    expect(navigationPlacement(1440, 'web')).toBe('top');
    expect(navigationPlacement(1440, 'ios')).toBe('bottom');
  });

  test('keeps poster frames in the portrait ratio', () => {
    for (const width of widths) {
      const columns = discoverColumnCount(width);
      const poster = posterFrame(width, columns, 16, 12);
      const ratio = poster.height / poster.width;

      expect(columns).toBeGreaterThanOrEqual(2);
      expect(poster.width).toBeGreaterThan(0);
      expect(ratio).toBeCloseTo(255 / 169, 1);
    }
  });

  test('covers heroes inside a bounded frame', () => {
    const phone = homeHeroFrame(390);
    const desktop = homeHeroFrame(1440);
    const seriesPhone = seriesHeroFrame(390);
    const seriesDesktop = seriesHeroFrame(1440);

    expect(phone).toEqual({ width: 390, height: 520 });
    expect(seriesPhone.height).toBe(488);
    expect(desktop.height).toBeLessThanOrEqual(460);
    expect(desktop.width).toBe(1120);
    expect(seriesDesktop.height).toBeLessThanOrEqual(480);
    expect(seriesDesktop.width).toBeLessThan(seriesDesktop.height * 3);
  });

  test('gives wider screens more coin packs per row', () => {
    expect(coinPackColumns(390)).toBe(2);
    expect(coinPackColumns(768)).toBe(3);
    expect(coinPackColumns(1440)).toBe(4);
  });

  test('uses browser storage only on web', () => {
    expect(storageKind('web')).toBe('web');
    expect(storageKind('ios')).toBe('mmkv');
    expect(storageKind('android')).toBe('mmkv');
  });
});

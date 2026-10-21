import { chipColors } from '@/components/GenreChip';
import { iconButtonMetrics } from '@/components/IconButton';
import { posterSize } from '@/components/PosterCard';
import { buttonFill } from '@/components/PrimaryButton';
import { screenEdges } from '@/components/Screen';
import { fontFaces, splashCanHide } from '@/theme/fonts';
import { colors, fontFamily, layout } from '@/theme/tokens';
import { resolveFontFamily, textRoles } from '@/theme/type';

describe('design system', () => {
  test('keeps the approved colors and both font families', () => {
    expect(colors.primary).toBe('#64EDF7');
    expect(colors.onPrimary).toBe('#044449');
    expect(colors.playerPrimary).toBe('#00C8E0');
    expect(colors.background).toBe('#000000');
    expect(textRoles.displayXL).toMatchObject({
      fontFamily: fontFamily.playfair,
      fontSize: 36,
      fontWeight: '700',
    });
    expect(textRoles.body).toMatchObject({
      fontFamily: fontFamily.inter,
      fontSize: 16,
      lineHeight: 24,
    });
    expect(textRoles.bodySmall.lineHeight).toBe(23);
    expect(textRoles.micro.fontSize).toBe(10);
  });

  test('loads Inter 400–700 and Playfair 500–700', () => {
    expect(fontFaces.map((face) => `${face.family}:${face.weight}`)).toEqual([
      'Inter:400',
      'Inter:500',
      'Inter:600',
      'Inter:700',
      'PlayfairDisplay:500',
      'PlayfairDisplay:600',
      'PlayfairDisplay:700',
    ]);
    expect(resolveFontFamily(true, fontFamily.playfair)).toBe('PlayfairDisplay');
    expect(resolveFontFamily(false, fontFamily.inter)).toBeUndefined();
  });

  test('hides the splash after fonts load or fail', () => {
    expect(splashCanHide(false, null)).toBe(false);
    expect(splashCanHide(true, null)).toBe(true);
    expect(splashCanHide(false, new Error('Font failed'))).toBe(true);
  });

  test('keeps the bottom inset off tab screens and the full-screen player', () => {
    expect(screenEdges.tabs).toEqual(['top', 'left', 'right']);
    expect(screenEdges.stack).toEqual(['top', 'right', 'bottom', 'left']);
    expect(screenEdges.full).toEqual([]);
  });

  test('uses the series length for poster, chip, and button variants', () => {
    expect(posterSize('rail')).toEqual(layout.posterRail);
    expect(posterSize('grid')).toEqual({ width: 169, height: 255 });
    expect(buttonFill('primary')).toBe(colors.primary);
    expect(buttonFill('player')).toBe(colors.playerPrimary);
    expect(chipColors(true)).toEqual({
      backgroundColor: colors.primary,
      color: colors.onPrimary,
    });
    expect(chipColors(false).backgroundColor).toBe(colors.surface);
    expect(iconButtonMetrics(48)).toEqual({ diameter: 48, glyph: 22 });
    expect(iconButtonMetrics(32).diameter).toBe(32);
  });
});

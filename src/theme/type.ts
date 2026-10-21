import { type TextStyle } from 'react-native';

import { colors, fontFamily } from '@/theme/tokens';

export const textRoles = {
  displayXL: {
    fontFamily: fontFamily.playfair,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    color: colors.text,
  },
  displayL: {
    fontFamily: fontFamily.playfair,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.text,
  },
  displayM: {
    fontFamily: fontFamily.playfair,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
  },
  titleL: {
    fontFamily: fontFamily.playfair,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
  titleM: {
    fontFamily: fontFamily.playfair,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  titleS: {
    fontFamily: fontFamily.playfair,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  titleXS: {
    fontFamily: fontFamily.playfair,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.inter,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.text,
  },
  bodyStrong: {
    fontFamily: fontFamily.inter,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
  bodySmall: {
    fontFamily: fontFamily.inter,
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: fontFamily.inter,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  micro: {
    fontFamily: fontFamily.inter,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
} as const satisfies Record<string, TextStyle>;

export type TextRole = keyof typeof textRoles;

export function resolveFontFamily(fontsReady: boolean, family: string): string | undefined {
  return fontsReady ? family : undefined;
}

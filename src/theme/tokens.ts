export const colors = {
  background: '#000000',
  playerScrim: '#061532',
  surface: '#18172B',
  surfaceRaised: '#1A192F',
  surfaceMedia: '#1E1D35',
  border: '#322F56',
  primary: '#64EDF7',
  onPrimary: '#044449',
  playerPrimary: '#00C8E0',
  accent: '#CB64F7',
  onAccent: '#340449',
  coin: '#FACC15',
  text: '#FFFFFF',
  textOnMedia: '#E5E7EB',
  textMeta: '#D1D5DB',
  textSecondary: '#C0BEDA',
  textMuted: '#9CA3AF',
} as const;

export type ColorName = keyof typeof colors;

export const fontFamily = {
  inter: 'Inter',
  playfair: 'PlayfairDisplay',
} as const;

export const space = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  48: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  card: 14,
  sheetInner: 18,
  sheet: 24,
} as const;

export const control = {
  button: 48,
  icon: 48,
  iconHeader: 32,
  chip: 34,
} as const;

export const iconSize = {
  tab: 24,
  button: 22,
  header: 18,
} as const;

export const iconStroke = 1.75;

export const pressOpacity = 0.7;
export const disabledOpacity = 0.4;

export const glow = {
  primary: { offsetY: 8, opacity: 0.2, radius: 12 },
  player: { offsetY: 8, opacity: 0.2, radius: 8 },
} as const;

export const layout = {
  marginScreen: 16,
  marginDetail: 20,
  marginHero: 24,
  tabBar: 64,
  posterRail: { width: 130, height: 195 },
  posterGrid: { width: 169, height: 255 },
} as const;

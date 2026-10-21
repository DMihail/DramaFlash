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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
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

const scrim = {
  clear: 'rgba(0, 0, 0, 0)',
  faint: 'rgba(0, 0, 0, 0.1)',
  top: 'rgba(0, 0, 0, 0.4)',
  mid: 'rgba(0, 0, 0, 0.6)',
  strong: 'rgba(0, 0, 0, 0.8)',
  solid: 'rgba(0, 0, 0, 1)',
} as const;

export const gradient = {
  brand: {
    colors: [colors.primary, colors.accent],
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  homeHeroTop: {
    colors: [scrim.top, scrim.clear, scrim.faint],
    locations: [0, 0.5, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  homeHeroBottom: {
    colors: [scrim.solid, scrim.strong, scrim.clear],
    locations: [0, 0.5, 1],
    start: { x: 0.5, y: 1 },
    end: { x: 0.5, y: 0 },
  },
  homeHeroTint: 'rgba(100, 237, 247, 0.1)',
  detailHero: {
    colors: [scrim.solid, scrim.mid, scrim.clear],
    locations: [0, 0.5, 1],
    start: { x: 0.5, y: 1 },
    end: { x: 0.5, y: 0 },
  },
  detailTopBar: {
    colors: [scrim.strong, scrim.clear],
    locations: [0, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    height: 96,
  },
  playerScrim: {
    colors: ['rgba(6, 21, 50, 0)', 'rgba(6, 21, 50, 0)', colors.playerScrim],
    locations: [0, 0.5, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    opacity: 0.9,
  },
} as const;

export const layout = {
  marginScreen: 16,
  marginDetail: 20,
  marginHero: 24,
  tabBar: 64,
  posterRail: { width: 130, height: 195 },
  posterGrid: { width: 169, height: 255 },
} as const;

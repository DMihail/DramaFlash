export const breakpoints = {
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type WindowTier = 'phone' | 'tablet' | 'desktop';

/** Poster height ÷ width. Design cards are 2:3 (130×195, library grids). */
export const posterAspectRatio = 3 / 2;

export function windowTier(windowWidth: number): WindowTier {
  if (windowWidth >= breakpoints.desktop) {
    return 'desktop';
  }

  if (windowWidth >= breakpoints.tablet) {
    return 'tablet';
  }

  return 'phone';
}

/**
 * Where the main tabs sit.
 *
 * Desktop web uses the top. Phones, native tablets, and narrow web keep the
 * bottom bar, including a wide iOS or Android window.
 */
export function navigationPlacement(windowWidth: number, platform: string): 'bottom' | 'top' {
  return platform === 'web' && windowTier(windowWidth) === 'desktop' ? 'top' : 'bottom';
}

export function contentMaxWidth(windowWidth: number): number {
  if (windowWidth >= breakpoints.wide) {
    return 1120;
  }

  if (windowWidth >= breakpoints.desktop) {
    return 960;
  }

  if (windowWidth >= breakpoints.tablet) {
    return Math.min(windowWidth - 48, 840);
  }

  return windowWidth;
}

export function contentWidth(windowWidth: number): number {
  return Math.min(windowWidth, contentMaxWidth(windowWidth));
}

export function discoverColumnCount(width: number): number {
  const available = contentWidth(width);

  if (available >= 1000) {
    return 5;
  }

  if (available >= 760) {
    return 4;
  }

  if (available >= 560) {
    return 3;
  }

  return 2;
}

export function fittedFrame(
  width: number,
  widthOverHeight: number,
  maxHeight: number,
): { width: number; height: number } {
  const naturalHeight = width / widthOverHeight;

  return { width, height: Math.min(Math.round(naturalHeight), maxHeight) };
}

export function homeHeroFrame(windowWidth: number): { width: number; height: number } {
  const width = contentWidth(windowWidth);
  const wide = width >= 720;

  return fittedFrame(width, wide ? 16 / 7 : 390 / 520, wide ? 460 : 640);
}

/**
 * Series hero frame.
 *
 * The phone frame matches the measured detail hero, 390 × 488. Wider windows
 * use a 16:9 crop so the portrait artwork is not stretched sideways.
 */
export function seriesHeroFrame(windowWidth: number): { width: number; height: number } {
  const width = contentWidth(windowWidth);
  const wide = width >= 720;

  return fittedFrame(width, wide ? 16 / 9 : 390 / 488, wide ? 480 : 640);
}

export function posterFrame(
  windowWidth: number,
  columns: number,
  margin: number,
  gap: number,
): { width: number; height: number } {
  const available = contentWidth(windowWidth) - margin * 2 - gap * (columns - 1);
  const width = Math.max(1, Math.floor(available / columns));

  return { width, height: Math.round(width * posterAspectRatio) };
}

/** Portrait poster size for a chosen card width. */
export function posterSizeForWidth(width: number): { width: number; height: number } {
  return { width, height: Math.round(width * posterAspectRatio) };
}

export function coinPackColumns(windowWidth: number): number {
  const width = contentWidth(windowWidth);

  if (width >= 960) {
    return 4;
  }

  if (width >= 680) {
    return 3;
  }

  return 2;
}

export function playerColumnWidth(windowWidth: number): number | undefined {
  if (windowWidth < breakpoints.tablet) {
    return undefined;
  }

  return Math.min(440, windowWidth);
}

export function storageKind(platform: string): 'mmkv' | 'web' {
  return platform === 'web' ? 'web' : 'mmkv';
}

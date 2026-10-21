import { createContext, createElement, type ReactNode, useContext } from 'react';

import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

import { fontFamily } from '@/theme/tokens';

export const fontFaces = [
  { family: fontFamily.inter, weight: 400, source: Inter_400Regular },
  { family: fontFamily.inter, weight: 500, source: Inter_500Medium },
  { family: fontFamily.inter, weight: 600, source: Inter_600SemiBold },
  { family: fontFamily.inter, weight: 700, source: Inter_700Bold },
  { family: fontFamily.playfair, weight: 500, source: PlayfairDisplay_500Medium },
  { family: fontFamily.playfair, weight: 600, source: PlayfairDisplay_600SemiBold },
  { family: fontFamily.playfair, weight: 700, source: PlayfairDisplay_700Bold },
] as const;

const appFonts = [fontFamily.inter, fontFamily.playfair].map((family) => ({
  fontFamily: family,
  fontDefinitions: fontFaces
    .filter((face) => face.family === family)
    .map((face) => ({ path: face.source, weight: face.weight })),
}));

export function splashCanHide(loaded: boolean, error: Error | null): boolean {
  return loaded || error !== null;
}

export function useAppFonts(): readonly [boolean, Error | null] {
  return useFonts(appFonts);
}

const FontReadyContext = createContext(false);

export function FontsProvider({ ready, children }: { ready: boolean; children: ReactNode }) {
  return createElement(FontReadyContext.Provider, { value: ready }, children);
}

export function useFontsReady(): boolean {
  return useContext(FontReadyContext);
}

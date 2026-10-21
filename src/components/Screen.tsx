import { type ReactNode } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

// tabs: the tab bar already pads the bottom.
// stack: screens outside the tabs need the bottom inset.
// full: the player is edge to edge and places its own controls.
export const screenEdges = {
  tabs: ['top', 'left', 'right'],
  stack: ['top', 'right', 'bottom', 'left'],
  full: [],
} as const satisfies Record<string, readonly Edge[]>;

export type ScreenSafeArea = keyof typeof screenEdges;

export function Screen({
  children,
  safeArea,
  style,
}: {
  children: ReactNode;
  safeArea: ScreenSafeArea;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={screenEdges[safeArea]} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

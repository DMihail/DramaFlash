import { type ReactNode } from 'react';
import {
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { contentMaxWidth } from '@/theme/responsive';
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
  frame = 'page',
  safeArea,
  style,
  testID,
}: {
  children: ReactNode;
  frame?: 'page' | 'stage';
  safeArea: ScreenSafeArea;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { width } = useWindowDimensions();
  const maxWidth = frame === 'page' ? contentMaxWidth(width) : undefined;

  return (
    <SafeAreaView
      edges={screenEdges[safeArea]}
      style={[styles.screen, style]}
      {...(testID ? { testID } : {})}
    >
      <View style={[styles.content, maxWidth ? { maxWidth } : null]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});

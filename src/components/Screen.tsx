import { type ReactNode } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { contentMaxWidth, navigationPlacement } from '@/theme/responsive';
import { colors } from '@/theme/tokens';

const fixedScreenEdges = {
  stack: ['top', 'right', 'bottom', 'left'],
  full: [],
} as const satisfies Record<string, readonly Edge[]>;

export type ScreenSafeArea = 'tabs' | keyof typeof fixedScreenEdges;

// Tab screens leave the bar's own edge to the bar.
// A bottom bar covers the home indicator. A top bar covers the status inset.
// Stack screens need every inset. The player stays edge to edge.
export function screenEdgesFor(
  safeArea: ScreenSafeArea,
  windowWidth: number,
  platform: string,
): readonly Edge[] {
  if (safeArea === 'tabs') {
    return navigationPlacement(windowWidth, platform) === 'top'
      ? ['bottom', 'left', 'right']
      : ['top', 'left', 'right'];
  }

  return fixedScreenEdges[safeArea];
}

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
  const edges = screenEdgesFor(safeArea, width, Platform.OS);

  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]} {...(testID ? { testID } : {})}>
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

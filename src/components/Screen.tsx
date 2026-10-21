import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

const defaultEdges: Edge[] = ['top', 'right', 'bottom', 'left'];

export function Screen({
  children,
  edges = defaultEdges,
  style,
}: {
  children: ReactNode;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
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

import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { layout, pressOpacity, space } from '@/theme/tokens';

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  inset = layout.marginScreen,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  inset?: typeof layout.marginScreen | typeof layout.marginDetail;
}) {
  return (
    <View style={[styles.row, { paddingHorizontal: inset }]}>
      <AppText role="titleM" style={styles.title}>
        {title}
      </AppText>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <AppText color="primary" role="caption">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[12],
  },
  title: {
    flexShrink: 1,
  },
  pressed: {
    opacity: pressOpacity,
  },
});

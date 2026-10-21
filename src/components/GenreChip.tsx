import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, control, pressOpacity, space } from '@/theme/tokens';

export function chipColors(selected: boolean): { backgroundColor: string; color: string } {
  return selected
    ? { backgroundColor: colors.primary, color: colors.onPrimary }
    : { backgroundColor: colors.surface, color: colors.textSecondary };
}

export function GenreChip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const palette = chipColors(selected);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: palette.backgroundColor },
        pressed ? styles.pressed : null,
      ]}
    >
      <AppText role="bodySmall" style={{ color: palette.color, fontWeight: '500' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: control.chip,
    borderRadius: control.chip / 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  pressed: {
    opacity: pressOpacity,
  },
});

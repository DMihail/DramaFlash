import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, control, iconSize, iconStroke, pressOpacity } from '@/theme/tokens';

export type IconButtonSize = typeof control.icon | typeof control.iconHeader;

export function iconButtonMetrics(size: IconButtonSize): { diameter: number; glyph: number } {
  return size === control.icon
    ? { diameter: control.icon, glyph: iconSize.button }
    : { diameter: control.iconHeader, glyph: iconSize.header };
}

export function IconButton({
  accessibilityLabel,
  icon: Icon,
  onPress,
  size = control.icon,
}: {
  accessibilityLabel: string;
  icon: LucideIcon;
  onPress?: () => void;
  size?: IconButtonSize;
}) {
  const metrics = iconButtonMetrics(size);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: metrics.diameter,
          height: metrics.diameter,
          borderRadius: metrics.diameter / 2,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <Icon color={colors.text} size={metrics.glyph} strokeWidth={iconStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: pressOpacity,
  },
});

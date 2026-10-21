import { Pressable, StyleSheet } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors, control, iconSize, iconStroke, pressOpacity } from '@/theme/tokens';

export type IconButtonSize = typeof control.icon | typeof control.iconHeader;

export function iconButtonMetrics(size: IconButtonSize): { diameter: number; glyph: number } {
  return size === control.icon
    ? { diameter: control.icon, glyph: iconSize.button }
    : { diameter: control.iconHeader, glyph: iconSize.header };
}

export function IconButton({
  accessibilityLabel,
  appearance = 'surface',
  filled = false,
  icon: Icon,
  onPress,
  size = control.icon,
  testID,
}: {
  accessibilityLabel: string;
  appearance?: 'plain' | 'surface';
  filled?: boolean;
  icon: LucideIcon;
  onPress?: () => void;
  size?: IconButtonSize;
  testID?: string;
}) {
  const metrics = iconButtonMetrics(size);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      {...(testID ? { testID } : {})}
      style={({ pressed }) => [
        styles.button,
        appearance === 'surface' ? styles.surface : null,
        {
          width: metrics.diameter,
          height: metrics.diameter,
          borderRadius: metrics.diameter / 2,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <Icon
        color={colors.text}
        size={metrics.glyph}
        strokeWidth={iconStroke}
        {...(filled ? { fill: colors.primary } : {})}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: pressOpacity,
  },
});

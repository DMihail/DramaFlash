import { Pressable, StyleSheet, View } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import {
  colors,
  control,
  disabledOpacity,
  glow,
  iconSize,
  iconStroke,
  pressOpacity,
  space,
} from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'player';

export function buttonFill(variant: ButtonVariant): string {
  return variant === 'player' ? colors.playerPrimary : colors.primary;
}

export function PrimaryButton({
  disabled = false,
  fill = false,
  icon: Icon,
  label,
  onPress,
  variant = 'primary',
}: {
  disabled?: boolean;
  fill?: boolean;
  icon?: LucideIcon;
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fill ? styles.fill : null,
        { backgroundColor: buttonFill(variant) },
        variant === 'primary' ? styles.glow : styles.playerGlow,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.content}>
        {Icon ? (
          <Icon color={colors.onPrimary} size={iconSize.button} strokeWidth={iconStroke} />
        ) : null}
        <AppText color="onPrimary" role="bodyStrong">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: control.button,
    borderRadius: control.button / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  fill: {
    flexGrow: 1,
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: glow.primary.offsetY },
    shadowOpacity: glow.primary.opacity,
    shadowRadius: glow.primary.radius,
    elevation: 2,
  },
  playerGlow: {
    shadowColor: colors.playerPrimary,
    shadowOffset: { width: 0, height: glow.player.offsetY },
    shadowOpacity: glow.player.opacity,
    shadowRadius: glow.player.radius,
    elevation: 2,
  },
  pressed: {
    opacity: pressOpacity,
  },
  disabled: {
    opacity: disabledOpacity,
  },
});

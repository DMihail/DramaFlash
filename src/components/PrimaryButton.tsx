import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, control, disabledOpacity, glow, pressOpacity, space } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'player';

export function buttonFill(variant: ButtonVariant): string {
  return variant === 'player' ? colors.playerPrimary : colors.primary;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: buttonFill(variant) },
        variant === 'primary' ? styles.glow : styles.playerGlow,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <AppText color="onPrimary" role="bodyStrong">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: control.button,
    borderRadius: control.button / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[24],
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

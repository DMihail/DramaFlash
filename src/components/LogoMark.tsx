import { StyleSheet, View } from 'react-native';

import { Heart } from 'lucide-react-native';

import { colors, iconSize, iconStroke, radius } from '@/theme/tokens';

/**
 * The DramaFlash mark: a heart outline on the cyan tile.
 *
 * FLASH.svg draws this mark as an outline, and the approved prototype uses the
 * same Lucide heart. The tile stays 32 pt with a 6 pt radius.
 */
export function LogoMark() {
  return (
    <View style={styles.logo}>
      <Heart color={colors.background} size={iconSize.logo} strokeWidth={iconStroke} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

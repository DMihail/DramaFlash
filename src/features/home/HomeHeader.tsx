import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Bell, Search } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { LogoMark } from '@/components/LogoMark';
import { homeAvatar } from '@/features/home/assets';
import { testIds } from '@/testing/testIds';
import { colors, control, pressOpacity, space } from '@/theme/tokens';

export function HomeHeader({
  onNotifications,
  onProfile,
  onSearch,
}: {
  onNotifications: () => void;
  onProfile: () => void;
  onSearch: () => void;
}) {
  return (
    <View style={styles.header}>
      <View accessibilityRole="header" style={styles.brand}>
        <LogoMark />
        <AppText role="titleL">DramaFlash</AppText>
      </View>
      <View style={styles.actions}>
        <IconButton
          accessibilityLabel="Search dramas"
          appearance="plain"
          icon={Search}
          onPress={onSearch}
          size={control.iconHeader}
          testID={testIds.home.search}
        />
        <View>
          <IconButton
            accessibilityLabel="Notifications"
            appearance="plain"
            icon={Bell}
            onPress={onNotifications}
            size={control.iconHeader}
            testID={testIds.home.notifications}
          />
          <View pointerEvents="none" style={styles.dot} />
        </View>
        <Pressable
          accessibilityLabel="Your profile"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onProfile}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
          testID={testIds.home.profile}
        >
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={homeAvatar}
            style={styles.avatar}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    top: 6,
    right: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: pressOpacity,
  },
});

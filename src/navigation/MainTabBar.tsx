import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { Bookmark, Compass, Heart, House, type LucideIcon, User } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { romanceDestination } from '@/features/home/model';
import { colors, iconSize, iconStroke, layout, pressOpacity } from '@/theme/tokens';

type TabRoute = { readonly key: string; readonly name: string };

const tabItems: readonly {
  label: string;
  icon: LucideIcon;
  routeName: string | null;
}[] = [
  { label: 'Home', icon: House, routeName: 'index' },
  { label: 'Discover', icon: Compass, routeName: 'discover' },
  { label: 'Romance', icon: Heart, routeName: null },
  { label: 'Library', icon: Bookmark, routeName: 'library' },
  { label: 'Profile', icon: User, routeName: 'profile' },
];

export function MainTabBar({
  insets,
  navigateToTab,
  placement,
  state,
}: {
  insets: { top: number; bottom: number };
  navigateToTab: (routeKey: string) => void;
  placement: 'bottom' | 'top';
  state: { index: number; routes: readonly TabRoute[] };
}) {
  const onTop = placement === 'top';

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        onTop ? styles.top : styles.bottom,
        onTop ? { paddingTop: insets.top } : { paddingBottom: insets.bottom },
      ]}
    >
      {tabItems.map((item) => {
        const route = item.routeName
          ? state.routes.find((candidate) => candidate.name === item.routeName)
          : undefined;
        const routeIndex = route ? state.routes.indexOf(route) : -1;
        const selected = routeIndex === state.index;
        const color = selected ? colors.primary : colors.textSecondary;
        const Icon = item.icon;

        const handlePress = () => {
          if (!route) {
            router.navigate(romanceDestination());
            return;
          }

          if (!selected) {
            navigateToTab(route.key);
          }
        };

        return (
          <Pressable
            key={item.label}
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={handlePress}
            style={({ pressed }) => [
              onTop ? styles.topItem : styles.item,
              pressed ? styles.pressed : null,
            ]}
          >
            <Icon color={color} size={iconSize.tab} strokeWidth={iconStroke} />
            <AppText numberOfLines={1} role="micro" style={{ color }}>
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: layout.tabBar,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  bottom: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  top: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  item: {
    flex: 1,
    maxWidth: 160,
    minHeight: layout.tabBar,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  topItem: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: layout.tabBar,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : null),
  },
  pressed: {
    opacity: pressOpacity,
  },
});

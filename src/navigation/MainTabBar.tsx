import { Pressable, StyleSheet, View } from 'react-native';

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
  state,
}: {
  insets: { bottom: number };
  navigateToTab: (routeKey: string) => void;
  state: { index: number; routes: readonly TabRoute[] };
}) {
  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: insets.bottom }]}>
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
            style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
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
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    minHeight: layout.tabBar,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  pressed: {
    opacity: pressOpacity,
  },
});

import { Platform, useWindowDimensions } from 'react-native';

import { Tabs } from 'expo-router';

import { MainTabBar } from '@/navigation/MainTabBar';
import { navigationPlacement } from '@/theme/responsive';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const placement = navigationPlacement(width, Platform.OS);

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: placement }}
      tabBar={(props) => (
        <MainTabBar
          insets={props.insets}
          navigateToTab={props.navigateToTab}
          placement={placement}
          state={props.state}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

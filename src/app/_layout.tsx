import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FontsProvider, splashCanHide, useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useAppFonts();
  const canHideSplash = splashCanHide(loaded, error);

  useEffect(() => {
    if (!canHideSplash) {
      return;
    }

    SplashScreen.hideAsync().catch(() => undefined);
  }, [canHideSplash]);

  if (!canHideSplash) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <FontsProvider ready={loaded && error === null}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="light" />
      </FontsProvider>
    </SafeAreaProvider>
  );
}

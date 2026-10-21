import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { asyncWalletStorage } from '@/data/walletStorage';
import { useWalletSelector, WalletProvider } from '@/features/wallet/WalletProvider';
import { createMmkvStorage } from '@/storage/mmkv';
import { FontsProvider, splashCanHide, useAppFonts } from '@/theme/fonts';

const walletStorage = createMmkvStorage();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <WalletProvider
      allowReset={isDevelopmentRuntime()}
      legacy={asyncWalletStorage}
      local={walletStorage}
    >
      <RootNavigator />
    </WalletProvider>
  );
}

function RootNavigator() {
  const walletStatus = useWalletSelector((state) => state.status);
  const [loaded, error] = useAppFonts();
  const [opened, setOpened] = useState(false);
  if (!opened && walletStatus !== 'loading') {
    setOpened(true);
  }
  const canHideSplash = splashCanHide(loaded, error) && (opened || walletStatus !== 'loading');

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

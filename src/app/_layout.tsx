import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { asyncWalletStorage } from '@/data/walletStorage';
import { useWallet, WalletProvider } from '@/features/wallet/WalletProvider';
import { FontsProvider, splashCanHide, useAppFonts } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <WalletProvider allowReset={isDevelopmentRuntime()} storage={asyncWalletStorage}>
      <RootNavigator />
    </WalletProvider>
  );
}

function RootNavigator() {
  const wallet = useWallet();
  const [loaded, error] = useAppFonts();
  const [opened, setOpened] = useState(false);
  if (!opened && wallet.status !== 'loading') {
    setOpened(true);
  }
  const canHideSplash = splashCanHide(loaded, error) && (opened || wallet.status !== 'loading');

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

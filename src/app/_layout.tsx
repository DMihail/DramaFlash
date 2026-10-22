import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { asyncWalletStorage } from '@/data/walletStorage';
import { AuthProvider, useAuthSelector } from '@/features/auth/AuthProvider';
import { LibraryProvider, useLibrarySelector } from '@/features/library/LibraryProvider';
import { useWalletSelector, WalletProvider } from '@/features/wallet/WalletProvider';
import { createAppStorage } from '@/storage/appStorage';
import { FontsProvider, splashCanHide, useAppFonts } from '@/theme/fonts';
import { WebFoundation } from '@/theme/WebFoundation';

const appStorage = createAppStorage();

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <WalletProvider
      allowReset={isDevelopmentRuntime()}
      legacy={asyncWalletStorage}
      local={appStorage}
    >
      <LibraryProvider allowReset={isDevelopmentRuntime()} local={appStorage}>
        <AuthProvider local={appStorage}>
          <RootNavigator />
        </AuthProvider>
      </LibraryProvider>
    </WalletProvider>
  );
}

function RootNavigator() {
  const walletStatus = useWalletSelector((state) => state.status);
  const libraryStatus = useLibrarySelector((state) => state.status);
  const authStatus = useAuthSelector((state) => state.status);
  const [loaded, error] = useAppFonts();
  const [opened, setOpened] = useState(false);
  const storageReady =
    walletStatus !== 'loading' && libraryStatus !== 'loading' && authStatus !== 'loading';
  if (!opened && storageReady) {
    setOpened(true);
  }
  const canHideSplash = splashCanHide(loaded, error) && (opened || storageReady);

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
        <WebFoundation />
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="light" />
      </FontsProvider>
    </SafeAreaProvider>
  );
}

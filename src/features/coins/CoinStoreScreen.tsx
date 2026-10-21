import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ChevronLeft, ShieldCheck, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { coinPacks, EPISODE_COST } from '@/domain/wallet';
import {
  coinBalanceLabel,
  coinPackTitle,
  demoPurchaseFailed,
  demoPurchaseNote,
  demoPurchaseSuccess,
  walletReadErrorMessage,
} from '@/features/coins/model';
import { useWallet } from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';
import { colors, gradient, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function CoinStoreScreen({ episode, seriesId }: { episode?: string; seriesId?: string }) {
  const insets = useSafeAreaInsets();
  const walletState = useWallet();
  const [selectedId, setSelectedId] = useState<(typeof coinPacks)[number]['id']>(coinPacks[0].id);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = coinPacks.find((pack) => pack.id === selectedId) ?? coinPacks[0];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (seriesId && episode) {
      router.replace({
        pathname: '/player/[seriesId]',
        params: { seriesId, episode },
      });
      return;
    }

    router.navigate('/');
  };

  const handleSelect = (packId: (typeof coinPacks)[number]['id']) => {
    setSelectedId(packId);
    setNotice(null);
  };

  const handleGrant = () => {
    if (walletState.busy || walletState.status !== 'ready') {
      return;
    }

    void walletState.grantPack(selected.id).then((result) => {
      if (result.status === 'saved') {
        setNotice(demoPurchaseSuccess);
        return;
      }

      if (result.status === 'save-failed') {
        setNotice(demoPurchaseFailed);
      }
    });
  };

  if (walletState.status === 'loading') {
    return (
      <Screen safeArea="stack" testID={testIds.wallet.loading}>
        <View style={styles.loading}>
          <Skeleton height={28} width={180} />
          <Skeleton height={88} width="100%" />
          <Skeleton height={220} width="100%" />
        </View>
      </Screen>
    );
  }

  if (walletState.status === 'error' || walletState.wallet === null) {
    return (
      <Screen safeArea="stack" testID={testIds.wallet.error}>
        <View style={styles.loading}>
          <AppText role="titleS">{walletReadErrorMessage}</AppText>
          <PrimaryButton
            label="Try again"
            onPress={walletState.retry}
            testID={testIds.wallet.retry}
          />
        </View>
      </Screen>
    );
  }

  const balance = walletState.wallet.balance;

  return (
    <Screen safeArea="full" testID={testIds.coins.store}>
      <LinearGradient
        colors={gradient.detailTopBar.colors}
        locations={gradient.detailTopBar.locations}
        start={gradient.detailTopBar.start}
        end={gradient.detailTopBar.end}
        style={[styles.headerWash, { height: gradient.detailTopBar.height + insets.top }]}
      />
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={ChevronLeft}
          onPress={handleBack}
          testID={testIds.coins.back}
        />
        <AppText role="titleS">Recharge coins</AppText>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.section }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          {seriesId && episode ? (
            <AppText role="bodySmall">{`Episode ${episode} is locked. It costs ${EPISODE_COST} coins.`}</AppText>
          ) : (
            <AppText role="bodySmall">Coins for your next episode.</AppText>
          )}
          <View style={styles.balanceCard}>
            <AppText role="caption">Your balance</AppText>
            <View style={styles.balanceValue}>
              <Zap color={colors.coin} size={iconSize.header} strokeWidth={iconStroke} />
              <AppText role="titleS" testID={testIds.coins.balance}>
                {coinBalanceLabel(balance)}
              </AppText>
            </View>
          </View>
          <AppText role="bodySmall">{demoPurchaseNote}</AppText>
          <View style={styles.grid}>
            {coinPacks.map((pack) => {
              const isSelected = pack.id === selected.id;
              return (
                <Pressable
                  accessibilityLabel={`${coinPackTitle(pack)}, ${pack.priceLabel}, demo only`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={pack.id}
                  onPress={() => handleSelect(pack.id)}
                  style={[styles.pack, isSelected ? styles.packSelected : null]}
                  testID={testIds.coins.package(pack.id)}
                >
                  {pack.badge ? <AppText role="caption">{pack.badge}</AppText> : null}
                  <Zap color={colors.coin} size={iconSize.button} strokeWidth={iconStroke} />
                  <AppText role="titleS">{coinPackTitle(pack)}</AppText>
                  <AppText role="caption">{`${pack.priceLabel} · Demo only`}</AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.demoRow}>
            <ShieldCheck color={colors.primary} size={iconSize.header} strokeWidth={iconStroke} />
            <AppText role="caption">Simulated purchase. No charge.</AppText>
          </View>
          <PrimaryButton
            disabled={walletState.busy}
            fill
            label={walletState.busy ? 'Adding demo coins' : `Add ${selected.coins} demo coins`}
            onPress={handleGrant}
            testID={testIds.coins.purchaseConfirm}
          />
          {notice ? (
            <AppText
              accessibilityLiveRegion="polite"
              role="bodySmall"
              {...(notice === demoPurchaseSuccess ? { testID: testIds.coins.purchaseSuccess } : {})}
            >
              {notice}
            </AppText>
          ) : null}
          {seriesId && episode ? (
            <PrimaryButton label="Back to episode" onPress={handleBack} variant="player" />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    gap: space.lg,
    padding: layout.marginScreen,
  },
  headerWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    paddingHorizontal: layout.marginScreen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  body: {
    padding: layout.marginScreen,
    gap: space.lg,
  },
  balanceCard: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  pack: {
    width: '47%',
    minHeight: 140,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    gap: space.sm,
  },
  packSelected: {
    borderColor: colors.primary,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});

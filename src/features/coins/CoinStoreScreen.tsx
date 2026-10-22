import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

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
import { posterArt } from '@/features/home/assets';
import { useWalletSelector } from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';
import { coinPackColumns, contentWidth } from '@/theme/responsive';
import { colors, gradient, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function CoinStoreScreen({ episode, seriesId }: { episode?: string; seriesId?: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = coinPackColumns(width);
  const packWidth = Math.max(
    1,
    Math.floor(
      (contentWidth(width) - layout.marginScreen * 2 - space.md * (columns - 1)) / columns,
    ),
  );
  const status = useWalletSelector((state) => state.status);
  const wallet = useWalletSelector((state) => state.wallet);
  const busy = useWalletSelector((state) => state.busy);
  const retry = useWalletSelector((state) => state.retry);
  const grantPack = useWalletSelector((state) => state.grantPack);
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
    if (busy || status !== 'ready') {
      return;
    }

    void grantPack(selected.id).then((result) => {
      if (result.status === 'saved') {
        setNotice(demoPurchaseSuccess);
        return;
      }

      if (result.status === 'save-failed') {
        setNotice(demoPurchaseFailed);
      }
    });
  };

  if (status === 'loading') {
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

  if (status === 'error' || wallet === null) {
    return (
      <Screen safeArea="stack" testID={testIds.wallet.error}>
        <View style={styles.loading}>
          <AppText role="titleS">{walletReadErrorMessage}</AppText>
          <PrimaryButton label="Try again" onPress={retry} testID={testIds.wallet.retry} />
        </View>
      </Screen>
    );
  }

  const balance = wallet.balance;
  const lockedCover = seriesId ? posterArt(seriesId) : undefined;

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
            <View style={styles.lockedCard}>
              {lockedCover ? (
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="cover"
                  source={lockedCover}
                  style={styles.lockedCover}
                />
              ) : null}
              <View style={styles.lockedCopy}>
                <AppText role="titleXS">Unlock episode</AppText>
                <AppText role="bodySmall">{`Episode ${episode} is locked. It costs ${EPISODE_COST} coins.`}</AppText>
              </View>
            </View>
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
                  style={[
                    styles.pack,
                    { width: packWidth },
                    pack.badge === 'Popular' ? styles.packPopular : null,
                    isSelected ? styles.packSelected : null,
                  ]}
                  testID={testIds.coins.package(pack.id)}
                >
                  {pack.badge === 'Best value' ? (
                    <LinearGradient
                      colors={[colors.accent, colors.primary]}
                      end={{ x: 1, y: 0.5 }}
                      start={{ x: 0, y: 0.5 }}
                      style={styles.ribbon}
                    >
                      <AppText role="micro" style={styles.ribbonText}>
                        BEST VALUE
                      </AppText>
                    </LinearGradient>
                  ) : null}
                  {pack.badge === 'Popular' ? (
                    <View style={styles.ribbonPlain}>
                      <AppText role="micro" style={styles.ribbonPlainText}>
                        POPULAR
                      </AppText>
                    </View>
                  ) : null}
                  <Zap color={colors.coin} size={iconSize.button} strokeWidth={iconStroke} />
                  <AppText role="titleS">{coinPackTitle(pack)}</AppText>
                  <AppText role="caption">{`${pack.priceLabel} · Demo only`}</AppText>
                </Pressable>
              );
            })}
          </View>
          <View accessibilityState={{ disabled: true }} style={styles.vip}>
            <AppText role="titleXS">VIP</AppText>
            <AppText role="caption">Not available in this demo. No coins are spent.</AppText>
          </View>
          <View style={styles.demoRow}>
            <ShieldCheck color={colors.primary} size={iconSize.header} strokeWidth={iconStroke} />
            <AppText role="caption">Simulated purchase. No charge.</AppText>
          </View>
          <PrimaryButton
            disabled={busy}
            fill
            label={busy ? 'Adding demo coins' : `Add ${selected.coins} demo coins`}
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
  lockedCard: {
    minHeight: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    alignItems: 'center',
  },
  lockedCover: {
    width: 80,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMedia,
  },
  lockedCopy: {
    flex: 1,
    gap: space.xs,
  },
  pack: {
    minHeight: 190,
    padding: space.md,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    gap: space.sm,
    overflow: 'hidden',
  },
  packPopular: {
    borderColor: colors.primary,
  },
  packSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(100, 237, 247, 0.1)',
  },
  ribbon: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  ribbonText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  ribbonPlain: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  ribbonPlainText: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  vip: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.xs,
    opacity: 0.7,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});

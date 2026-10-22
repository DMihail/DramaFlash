import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { router } from 'expo-router';

import { Bookmark } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { PosterCard } from '@/components/PosterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { findSeries } from '@/data/catalog';
import { posterArt } from '@/features/home/assets';
import { seriesDestination } from '@/features/home/model';
import { useLibrarySelector } from '@/features/library/LibraryProvider';
import {
  type ContinueItem,
  continueItems,
  libraryContinueTitle,
  libraryEmptyBody,
  libraryEmptyTitle,
  libraryExploreLabel,
  libraryIntroBody,
  libraryIntroTitle,
  libraryReadErrorMessage,
  librarySavedTitle,
  libraryTitle,
  purchaseLines,
  resumeDestination,
  savedPosters,
  savedProgressLabel,
} from '@/features/library/model';
import { useOptionalWallet } from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';
import { contentWidth } from '@/theme/responsive';
import { colors, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function LibraryScreen() {
  const { width } = useWindowDimensions();
  const [libraryTab, setLibraryTab] = useState<'saved' | 'purchases'>('saved');
  const status = useLibrarySelector((state) => state.status);
  const savedSeriesIds = useLibrarySelector((state) => state.savedSeriesIds);
  const entries = useLibrarySelector((state) => state.entries);
  const retry = useLibrarySelector((state) => state.retry);
  const wallet = useOptionalWallet();
  // A missing or unreadable wallet still leaves free episodes open. Paid
  // progress stays hidden until the real unlocks load.
  const continueWallet = wallet?.status === 'ready' ? wallet.wallet : null;
  const continueList =
    status === 'ready' && wallet?.status !== 'loading'
      ? continueItems(entries, continueWallet)
      : [];
  const saved = status === 'ready' ? savedPosters(savedSeriesIds) : [];
  const purchases =
    wallet?.status === 'ready' && wallet.wallet ? purchaseLines(wallet.wallet) : [];
  const columns = width >= 768 ? (width >= 1024 ? 4 : 3) : 2;
  const cardWidth = Math.max(
    1,
    Math.floor(
      (contentWidth(width) - layout.marginScreen * 2 - space.md * (columns - 1)) / columns,
    ),
  );
  const cardSize = { width: cardWidth, height: Math.round(cardWidth * 1.5) };

  const handleExplore = () => {
    router.navigate('/');
  };

  const handleRetry = () => {
    void retry();
  };

  const handleOpenSaved = (seriesId: string) => {
    router.push(seriesDestination(seriesId));
  };

  const handleResume = (item: ContinueItem) => {
    const destination = resumeDestination(item.seriesId, item.episode);
    if (!destination) {
      return;
    }

    router.push(destination);
  };

  if (status === 'loading' || (status === 'ready' && wallet && wallet.status === 'loading')) {
    return (
      <Screen safeArea="tabs" testID={testIds.library.loading}>
        <View
          accessibilityLabel="Loading library"
          accessibilityState={{ busy: true }}
          style={styles.loading}
        >
          <Skeleton height={32} width="55%" />
          <Skeleton height={18} width="80%" />
          <Skeleton height={195} width={130} />
        </View>
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen safeArea="tabs" testID={testIds.library.error}>
        <View style={styles.loading}>
          <AppText role="titleS">{libraryReadErrorMessage}</AppText>
          <PrimaryButton label="Try again" onPress={handleRetry} testID={testIds.library.retry} />
        </View>
      </Screen>
    );
  }

  const showEmpty = saved.length === 0 && continueList.length === 0 && purchases.length === 0;

  return (
    <Screen safeArea="tabs" testID={testIds.library.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText accessibilityRole="header" role="displayL" style={styles.header}>
          {libraryTitle}
        </AppText>
        <AppText role="titleM" style={styles.introTitle}>
          {libraryIntroTitle}
        </AppText>
        <AppText role="bodySmall" style={styles.intro}>
          {libraryIntroBody}
        </AppText>
        {showEmpty ? (
          <View style={styles.empty} testID={testIds.library.empty}>
            <Bookmark color={colors.primary} size={iconSize.tab} strokeWidth={iconStroke} />
            <AppText role="titleM">{libraryEmptyTitle}</AppText>
            <AppText role="bodySmall" style={styles.intro}>
              {libraryEmptyBody}
            </AppText>
            <PrimaryButton
              label={libraryExploreLabel}
              onPress={handleExplore}
              testID={testIds.library.explore}
            />
          </View>
        ) : (
          <>
            {continueList.length > 0 ? (
              <View style={styles.section} testID={testIds.library.continue}>
                <SectionHeader title={libraryContinueTitle} />
                {continueList.map((item) => {
                  const image = posterArt(item.seriesId);

                  return (
                    <View key={item.seriesId} style={styles.continueRow}>
                      <PosterCard
                        meta={item.meta}
                        onPress={() => handleResume(item)}
                        testID={testIds.library.resume(item.seriesId)}
                        title={item.title}
                        variant="rail"
                        {...(image ? { image } : {})}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}
            <View style={styles.tabs}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: libraryTab === 'saved' }}
                onPress={() => setLibraryTab('saved')}
                style={[styles.tab, libraryTab === 'saved' ? styles.tabSelected : null]}
              >
                <AppText role="caption">Saved</AppText>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: libraryTab === 'purchases' }}
                onPress={() => setLibraryTab('purchases')}
                style={[styles.tab, libraryTab === 'purchases' ? styles.tabSelected : null]}
                testID={testIds.library.purchases}
              >
                <AppText role="caption">Purchases</AppText>
              </Pressable>
            </View>
            {libraryTab === 'saved' && saved.length > 0 ? (
              <View style={styles.section} testID={testIds.library.saved}>
                <SectionHeader title={librarySavedTitle} />
                <View style={styles.grid}>
                  {saved.map((poster) => {
                    const image = posterArt(poster.id);
                    const meta = savedProgressLabel(
                      poster.id,
                      findSeries(poster.id)?.episodeCount ?? null,
                      continueList,
                    );

                    return (
                      <PosterCard
                        key={poster.id}
                        onPress={() => handleOpenSaved(poster.id)}
                        size={cardSize}
                        testID={testIds.library.poster(poster.id)}
                        title={poster.title}
                        variant="grid"
                        {...(image ? { image } : {})}
                        {...(meta ? { meta } : {})}
                      />
                    );
                  })}
                </View>
              </View>
            ) : null}
            {libraryTab === 'purchases' ? (
              <View style={styles.section}>
                <SectionHeader title="Purchases" />
                {purchases.length === 0 ? (
                  <AppText role="bodySmall" style={styles.intro}>
                    No episode unlocks on this device yet.
                  </AppText>
                ) : (
                  purchases.map((line) => (
                    <Pressable
                      key={line.seriesId}
                      accessibilityRole="button"
                      onPress={() => handleOpenSaved(line.seriesId)}
                      style={styles.purchaseRow}
                    >
                      <AppText role="titleXS">{line.title}</AppText>
                      <AppText role="caption">{`Episodes ${line.episodes.join(', ')}`}</AppText>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space.xxxl,
    gap: space.sm,
  },
  header: {
    paddingHorizontal: layout.marginScreen,
    paddingBottom: space.md,
  },
  introTitle: {
    paddingHorizontal: layout.marginScreen,
  },
  intro: {
    paddingHorizontal: layout.marginScreen,
    color: colors.textSecondary,
  },
  section: {
    gap: space.md,
    paddingTop: space.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: layout.marginScreen,
    paddingTop: space.lg,
  },
  tab: {
    minHeight: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.sheet,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(100, 237, 247, 0.12)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: layout.marginScreen,
  },
  purchaseRow: {
    marginHorizontal: layout.marginScreen,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: space.xs,
  },
  continueRow: {
    paddingHorizontal: layout.marginScreen,
  },
  empty: {
    marginTop: space.xxl,
    paddingHorizontal: layout.marginScreen,
    gap: space.md,
    alignItems: 'flex-start',
  },
  loading: {
    flex: 1,
    padding: layout.marginScreen,
    gap: space.lg,
  },
});

import { useEffect, useState } from 'react';
import { FlatList, Share, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadSeriesDetails } from '@/api/series';
import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { type DemoAuth } from '@/domain/auth';
import { type Wallet } from '@/domain/wallet';
import { walletReadErrorMessage } from '@/features/coins/model';
import { posterArt } from '@/features/home/assets';
import {
  continueEpisode,
  emptyEpisodesMessage,
  episodeAccess,
  episodeListCanToggle,
  type EpisodeSort,
  playerDestination,
  recommendationDestination,
  seriesErrorMessage,
  seriesLoginDestination,
  seriesNotFoundTitle,
  seriesSaveRequest,
  sharePayload,
  sharingUnavailableMessage,
  visibleEpisodes,
} from '@/features/series/model';
import { SeriesDetailsFooter } from '@/features/series/SeriesDetailsFooter';
import { SeriesDetailsHeader } from '@/features/series/SeriesDetailsHeader';
import { SeriesDetailsLoading, SeriesDetailsMessage } from '@/features/series/SeriesDetailsStatus';
import { SeriesEpisodeRow } from '@/features/series/SeriesEpisodeRow';
import { type SeriesDetailsLoader, useSeriesDetails } from '@/features/series/useSeriesDetails';
import { resolveScreenWallet } from '@/features/wallet/resolveWallet';
import { useOptionalWallet } from '@/features/wallet/WalletProvider';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { testIds } from '@/testing/testIds';
import { colors, layout, radius, space } from '@/theme/tokens';

// A guest save opens Login. This screen does not mark a series as saved.
// The shared wallet is used unless a test passes its own wallet.
export function SeriesDetailsScreen({
  auth = null,
  loadSeries = loadSeriesDetails,
  seriesId,
  wallet,
}: {
  auth?: DemoAuth | null;
  loadSeries?: SeriesDetailsLoader;
  seriesId: string | undefined;
  wallet?: Wallet;
}) {
  const insets = useSafeAreaInsets();
  const shared = useOptionalWallet();
  const { retry, state } = useSeriesDetails(seriesId, loadSeries);
  const [sort, setSort] = useState<EpisodeSort>('asc');
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const resolved = resolveScreenWallet(wallet, shared);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/');
    }
  };

  const handleRetry = () => {
    retry();
  };

  if (resolved.kind === 'loading') {
    return (
      <SeriesDetailsLoading
        onBack={handleBack}
        testID={testIds.wallet.loading}
        topInset={insets.top}
      />
    );
  }

  if (resolved.kind === 'error') {
    return (
      <Screen safeArea="full" testID={testIds.wallet.error}>
        <View style={styles.walletStatus}>
          <AppText role="titleS">{walletReadErrorMessage}</AppText>
          {shared ? (
            <PrimaryButton label="Try again" onPress={shared.retry} testID={testIds.wallet.retry} />
          ) : null}
        </View>
      </Screen>
    );
  }

  const episodesWallet = resolved.wallet;

  const handleSort = () => {
    setSort((current) => (current === 'asc' ? 'desc' : 'asc'));
  };

  const handleToggleEpisodes = () => {
    setExpanded((current) => !current);
  };

  const handleSave = () => {
    if (!seriesId) {
      return;
    }

    const result = seriesSaveRequest(seriesId, auth);
    if (result.type !== 'login') {
      return;
    }

    holdLoginTicket(result.ticket);
    router.push(seriesLoginDestination());
  };

  const handleShare = () => {
    if (state.status !== 'success') {
      return;
    }

    void shareSeries(state.data.series.title, setNotice);
  };

  const handleOpenEpisode = (episode: number) => {
    if (state.status !== 'success') {
      return;
    }

    const destination = playerDestination(
      state.data.series.id,
      episode,
      state.data.series.episodeCount,
    );
    if (!destination) {
      return;
    }

    router.push(destination);
  };

  const handlePlayFirst = () => {
    handleOpenEpisode(1);
  };

  const handleOpenRecommendation = (id: string) => {
    router.push(recommendationDestination(id));
  };

  const handleContinue = () => {
    if (state.status !== 'success') {
      return;
    }

    const nextLocked = continueEpisode(
      episodesWallet,
      state.data.series.id,
      state.data.series.episodeCount,
    );
    if (nextLocked === null) {
      return;
    }

    handleOpenEpisode(nextLocked);
  };

  if (state.status === 'loading') {
    return <SeriesDetailsLoading onBack={handleBack} topInset={insets.top} />;
  }

  if (state.status === 'error') {
    return (
      <SeriesDetailsMessage
        onBack={handleBack}
        onRetry={handleRetry}
        title={seriesErrorMessage}
        topInset={insets.top}
      />
    );
  }

  if (state.status === 'not-found') {
    return (
      <SeriesDetailsMessage
        onBack={handleBack}
        title={seriesNotFoundTitle}
        topInset={insets.top}
        {...(seriesId ? { detail: seriesId } : {})}
      />
    );
  }

  const { data } = state;
  const rows = visibleEpisodes(data.episodes, sort, expanded);
  const nextLocked = continueEpisode(episodesWallet, data.series.id, data.series.episodeCount);
  const artwork = posterArt(data.series.id);
  const sortLabel = sort === 'asc' ? 'Sort episodes, oldest first' : 'Sort episodes, newest first';

  return (
    <Screen safeArea="full" testID={testIds.series.screen}>
      <FlatList
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        data={rows}
        keyExtractor={(item) => String(item.number)}
        ListEmptyComponent={
          data.episodeStatus === 'empty' ? (
            <AppText role="body" style={styles.emptyEpisodes}>
              {emptyEpisodesMessage}
            </AppText>
          ) : undefined
        }
        ListFooterComponent={
          <SeriesDetailsFooter
            canToggle={episodeListCanToggle(data.episodes.length)}
            expanded={expanded}
            nextLocked={nextLocked}
            onContinue={handleContinue}
            onOpenRecommendation={handleOpenRecommendation}
            onToggle={handleToggleEpisodes}
            recommendations={data.recommendationStatus === 'success' ? data.recommendations : []}
          />
        }
        ListHeaderComponent={
          <SeriesDetailsHeader
            episodeCount={data.series.episodeCount}
            onBack={handleBack}
            onPlay={handlePlayFirst}
            onSave={handleSave}
            onShare={handleShare}
            onSort={handleSort}
            showPlay={data.episodes.some((episode) => episode.number === 1)}
            showSort={data.episodeStatus === 'success'}
            sortLabel={sortLabel}
            title={data.series.title}
            topInset={insets.top}
            {...(artwork ? { image: artwork } : {})}
          />
        }
        renderItem={({ item }) => (
          <SeriesEpisodeRow
            access={episodeAccess(
              episodesWallet,
              data.series.id,
              item.number,
              data.series.episodeCount,
            )}
            episode={item}
            onPress={handleOpenEpisode}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, { bottom: insets.bottom + space.lg }]}
        >
          <AppText role="bodySmall" style={styles.noticeText}>
            {notice}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

async function shareSeries(title: string, onUnavailable: (message: string) => void) {
  try {
    await Share.share(sharePayload(title));
  } catch {
    onUnavailable(sharingUnavailableMessage);
  }
}

const styles = StyleSheet.create({
  emptyEpisodes: {
    paddingHorizontal: layout.marginDetail,
    paddingVertical: space.md,
  },
  notice: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  noticeText: {
    color: colors.text,
  },
  walletStatus: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: layout.marginDetail,
  },
});

import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { ArrowUpDown, ChevronLeft, Heart, Lock, Play, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type SeriesEpisode } from '@/api/series';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PosterCard } from '@/components/PosterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { freshWallet } from '@/domain/wallet';
import { posterArt } from '@/features/home/assets';
import {
  accessLabel,
  continueEpisode,
  continueMessage,
  continueTitle,
  detailsPanel,
  emptyEpisodesMessage,
  type EpisodeAccess,
  episodeAccess,
  episodeActionLabel,
  episodeCountLabel,
  episodeListCanToggle,
  episodeMetaLabel,
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
import { SeriesDetailsSkeleton } from '@/features/series/SeriesDetailsSkeleton';
import { useSeriesDetails } from '@/features/series/useSeriesDetails';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { colors, control, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function SeriesDetailsScreen({ seriesId }: { seriesId: string | undefined }) {
  const insets = useSafeAreaInsets();
  const { retry, state } = useSeriesDetails(seriesId);
  const [sort, setSort] = useState<EpisodeSort>('asc');
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const wallet = freshWallet();
  const panel = detailsPanel(state);

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

    const result = seriesSaveRequest(seriesId);
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

  if (state.status === 'loading' || panel === 'skeleton') {
    return (
      <Screen safeArea="full">
        <SeriesDetailsSkeleton />
        <View style={[styles.overlayBack, { top: insets.top + space[8] }]}>
          <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={handleBack} />
        </View>
      </Screen>
    );
  }

  if (state.status === 'error' || state.status === 'not-found') {
    return (
      <Screen safeArea="full">
        <View style={[styles.statusBar, { paddingTop: insets.top + space[8] }]}>
          <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={handleBack} />
        </View>
        <View style={styles.statusBody}>
          <AppText role="displayM" style={styles.center}>
            {state.status === 'error' ? seriesErrorMessage : seriesNotFoundTitle}
          </AppText>
          {state.status === 'not-found' && seriesId ? (
            <AppText role="body" style={styles.center}>
              {seriesId}
            </AppText>
          ) : null}
          {state.status === 'error' ? <PrimaryButton label="Retry" onPress={handleRetry} /> : null}
        </View>
      </Screen>
    );
  }

  const { data } = state;
  const rows = visibleEpisodes(data.episodes, sort, expanded);
  const canToggle = episodeListCanToggle(data.episodes.length);
  const nextLocked = continueEpisode(wallet, data.series.id, data.series.episodeCount);
  const artwork = posterArt(data.series.id);
  const sortLabel = sort === 'asc' ? 'Sort episodes, oldest first' : 'Sort episodes, newest first';

  const openContinue = () => {
    if (nextLocked === null) {
      return;
    }

    handleOpenEpisode(nextLocked);
  };

  return (
    <Screen safeArea="full">
      <FlatList
        contentContainerStyle={{ paddingBottom: insets.bottom + space[32] }}
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
          <View>
            {canToggle ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleToggleEpisodes}
                style={styles.showMore}
              >
                <AppText color="textSecondary" role="bodySmall">
                  {expanded ? 'Show less' : 'Show more episodes'}
                </AppText>
              </Pressable>
            ) : null}
            {nextLocked !== null ? (
              <Pressable
                accessibilityRole="button"
                onPress={openContinue}
                style={styles.continueCard}
              >
                <View style={styles.continueCopy}>
                  <AppText role="titleS">{continueTitle}</AppText>
                  <AppText role="caption">{continueMessage(nextLocked)}</AppText>
                </View>
              </Pressable>
            ) : null}
            {data.recommendationStatus === 'success' ? (
              <View style={styles.recommendations}>
                <AppText role="titleM" style={styles.sectionTitle}>
                  You might also like
                </AppText>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.rail}
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                >
                  {data.recommendations.map((series) => {
                    const image = posterArt(series.id);
                    const meta = episodeMetaLabel(series.episodeCount);
                    return (
                      <PosterCard
                        key={series.id}
                        onPress={() => handleOpenRecommendation(series.id)}
                        title={series.title}
                        {...(image ? { image } : {})}
                        {...(meta ? { meta } : {})}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View>
            <View>
              {artwork ? (
                <Image accessibilityIgnoresInvertColors source={artwork} style={styles.hero} />
              ) : (
                <View style={[styles.hero, styles.heroFallback]} />
              )}
              <View style={[styles.heroBar, { paddingTop: insets.top + space[8] }]}>
                <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={handleBack} />
                <View style={styles.heroActions}>
                  <IconButton
                    accessibilityLabel="Share series"
                    icon={Share2}
                    onPress={handleShare}
                  />
                  <IconButton accessibilityLabel="Save series" icon={Heart} onPress={handleSave} />
                </View>
              </View>
            </View>
            <View style={styles.copy}>
              <AppText accessibilityRole="header" role="displayL">
                {data.series.title}
              </AppText>
              <AppText role="bodySmall">{episodeCountLabel(data.series.episodeCount)}</AppText>
              {data.episodes.some((episode) => episode.number === 1) ? (
                <PrimaryButton
                  fill
                  icon={Play}
                  label="Play Ep 1"
                  onPress={handlePlayFirst}
                  variant="player"
                />
              ) : null}
            </View>
            <View style={styles.episodeHeading}>
              <View style={styles.episodeTitle}>
                <AppText role="titleM">Episodes</AppText>
                {data.series.episodeCount !== null ? (
                  <AppText role="caption">{data.series.episodeCount}</AppText>
                ) : null}
              </View>
              {data.episodeStatus === 'success' ? (
                <Pressable
                  accessibilityLabel={sortLabel}
                  accessibilityRole="button"
                  onPress={handleSort}
                  style={styles.sortButton}
                >
                  <ArrowUpDown
                    color={colors.primary}
                    size={iconSize.header}
                    strokeWidth={iconStroke}
                  />
                  <AppText color="primary" role="caption">
                    Sort
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <EpisodeRow
            access={episodeAccess(wallet, data.series.id, item.number, data.series.episodeCount)}
            episode={item}
            onPress={handleOpenEpisode}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      {notice ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, { bottom: insets.bottom + space[16] }]}
        >
          <AppText role="bodySmall" style={styles.noticeText}>
            {notice}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

function EpisodeRow({
  access,
  episode,
  onPress,
}: {
  access: EpisodeAccess;
  episode: SeriesEpisode;
  onPress: (episode: number) => void;
}) {
  if (access === 'invalid') {
    return null;
  }

  const label = accessLabel(access);
  const handlePress = () => {
    onPress(episode.number);
  };

  return (
    <Pressable
      accessibilityLabel={episodeActionLabel(access, episode.number)}
      accessibilityRole="button"
      onPress={handlePress}
      style={styles.episodeRow}
    >
      <View style={[styles.episodeBadge, access === 'locked' ? styles.episodeLocked : null]}>
        {access === 'locked' ? (
          <Lock color={colors.text} size={iconSize.header} strokeWidth={iconStroke} />
        ) : (
          <Play color={colors.onPrimary} size={iconSize.header} strokeWidth={iconStroke} />
        )}
      </View>
      <View style={styles.episodeCopy}>
        <AppText role="titleXS">Episode {episode.number}</AppText>
        {label ? (
          <AppText color={access === 'locked' ? 'accent' : 'textSecondary'} role="caption">
            {label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
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
  overlayBack: {
    position: 'absolute',
    left: layout.marginDetail,
  },
  statusBar: {
    paddingHorizontal: layout.marginDetail,
  },
  statusBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.marginDetail,
    gap: space[16],
  },
  center: {
    textAlign: 'center',
  },
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMedia,
  },
  heroFallback: {
    backgroundColor: colors.surface,
  },
  heroBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.marginDetail,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: space[8],
  },
  copy: {
    paddingHorizontal: layout.marginDetail,
    paddingTop: space[20],
    gap: space[12],
  },
  episodeHeading: {
    marginTop: space[24],
    paddingHorizontal: layout.marginDetail,
    paddingBottom: space[8],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  episodeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  sortButton: {
    minHeight: control.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[8],
  },
  episodeRow: {
    minHeight: control.button,
    marginHorizontal: layout.marginDetail,
    marginBottom: space[8],
    paddingVertical: space[8],
    paddingHorizontal: space[12],
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  episodeBadge: {
    width: control.icon,
    height: control.icon,
    borderRadius: control.icon / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeLocked: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  episodeCopy: {
    flex: 1,
    gap: space[4],
  },
  emptyEpisodes: {
    paddingHorizontal: layout.marginDetail,
    paddingVertical: space[12],
  },
  showMore: {
    minHeight: control.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    marginHorizontal: layout.marginDetail,
    marginTop: space[16],
    padding: space[16],
    borderRadius: radius.card,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueCopy: {
    gap: space[8],
  },
  recommendations: {
    marginTop: space[32],
    gap: space[16],
  },
  sectionTitle: {
    paddingHorizontal: layout.marginDetail,
  },
  rail: {
    paddingHorizontal: layout.marginDetail,
    flexDirection: 'row',
    gap: space[12],
  },
  notice: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  noticeText: {
    color: colors.text,
  },
});

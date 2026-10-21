import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { loadPlayerEpisode } from '@/api/player';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { type DemoAuth } from '@/domain/auth';
import { type Wallet } from '@/domain/wallet';
import { posterArt } from '@/features/home/assets';
import { loginDestination, requestSeriesSave, seriesDestination } from '@/features/home/model';
import {
  adjacentEpisode,
  commentsUnavailableMessage,
  episodeOutOfRangeMessage,
  playerAccess,
  playerErrorMessage,
  previewFor,
  requestedEpisode,
  shareMessage,
  unlockDestination,
} from '@/features/player/model';
import { PlayerSkeleton } from '@/features/player/PlayerSkeleton';
import { PlayerStage } from '@/features/player/PlayerStage';
import { type PlayerLoader, usePlayerEpisode } from '@/features/player/usePlayerEpisode';
import { seriesNotFoundTitle, sharingUnavailableMessage } from '@/features/series/model';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { colors, layout, radius, space } from '@/theme/tokens';

export function PlayerScreen({
  auth = null,
  episodeParam,
  loadEpisode = loadPlayerEpisode,
  seriesId,
  wallet,
}: {
  auth?: DemoAuth | null;
  episodeParam: string | undefined;
  loadEpisode?: PlayerLoader;
  seriesId: string | undefined;
  wallet?: Wallet;
}) {
  const insets = useSafeAreaInsets();
  const episode = requestedEpisode(episodeParam);
  const { retry, state } = usePlayerEpisode(seriesId, episode, loadEpisode);
  const [notice, setNotice] = useState<string | null>(null);

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
      return;
    }

    if (seriesId) {
      router.navigate(seriesDestination(seriesId));
      return;
    }

    router.navigate('/');
  };

  const handleRetry = () => {
    retry();
  };

  if (state.status === 'loading') {
    return (
      <Screen safeArea="full">
        <PlayerSkeleton />
        <View style={[styles.overlayBack, { top: insets.top + space.sm }]}>
          <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={handleBack} />
        </View>
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <PlayerMessage
        bottomInset={insets.bottom}
        onBack={handleBack}
        onRetry={handleRetry}
        title={playerErrorMessage}
        topInset={insets.top}
      />
    );
  }

  if (state.status === 'not-found') {
    return (
      <PlayerMessage
        bottomInset={insets.bottom}
        onBack={handleBack}
        title={seriesNotFoundTitle}
        topInset={insets.top}
        {...(seriesId ? { detail: seriesId } : {})}
      />
    );
  }

  if (state.status === 'out-of-range') {
    return (
      <PlayerMessage
        bottomInset={insets.bottom}
        onBack={handleBack}
        title={episodeOutOfRangeMessage}
        topInset={insets.top}
      />
    );
  }

  const { data } = state;
  const artwork = posterArt(data.series.id);
  const preview = previewFor(data, artwork !== undefined);
  const access = playerAccess(wallet, data.series.id, data.episode, data.series.episodeCount);
  const previous = adjacentEpisode(data.episode, data.series.episodeCount, -1);
  const next = adjacentEpisode(data.episode, data.series.episodeCount, 1);

  const handleEpisodeChange = (nextEpisode: number | null) => {
    if (nextEpisode === null || !seriesId) {
      return;
    }

    router.setParams({ episode: String(nextEpisode) });
  };

  const handlePrevious = () => {
    handleEpisodeChange(previous);
  };

  const handleNext = () => {
    handleEpisodeChange(next);
  };

  const handleEpisodes = () => {
    router.push(seriesDestination(data.series.id));
  };

  const handleUnlock = () => {
    router.push(unlockDestination(data.series.id, data.episode));
  };

  const handleSave = () => {
    const result = requestSeriesSave(auth, data.series.id);
    if (result.type !== 'login') {
      return;
    }

    holdLoginTicket(result.ticket);
    router.push(loginDestination());
  };

  const handleComments = () => {
    setNotice(commentsUnavailableMessage);
  };

  const handleShare = () => {
    void shareEpisode(data.series.title, data.episode, setNotice);
  };

  return (
    <Screen safeArea="full">
      <PlayerStage
        access={access}
        bottomInset={insets.bottom}
        episode={data.episode}
        nextEpisode={next}
        onBack={handleBack}
        onComments={handleComments}
        onEpisodes={handleEpisodes}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleSave}
        onShare={handleShare}
        onUnlock={handleUnlock}
        preview={preview}
        previousEpisode={previous}
        title={data.series.title}
        topInset={insets.top}
        {...(artwork && preview === 'artwork' ? { image: artwork } : {})}
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

function PlayerMessage({
  bottomInset,
  detail,
  onBack,
  onRetry,
  title,
  topInset,
}: {
  bottomInset: number;
  detail?: string;
  onBack: () => void;
  onRetry?: () => void;
  title: string;
  topInset: number;
}) {
  return (
    <Screen safeArea="full">
      <View style={[styles.statusBar, { paddingTop: topInset + space.sm }]}>
        <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={onBack} />
      </View>
      <View style={[styles.statusBody, { paddingBottom: bottomInset }]}>
        <AppText role="displayM" style={styles.center}>
          {title}
        </AppText>
        {detail ? (
          <AppText role="body" style={styles.center}>
            {detail}
          </AppText>
        ) : null}
        {onRetry ? <PrimaryButton label="Retry" onPress={onRetry} /> : null}
      </View>
    </Screen>
  );
}

async function shareEpisode(
  title: string,
  episode: number,
  onUnavailable: (message: string) => void,
) {
  try {
    await Share.share(shareMessage(title, episode));
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
    gap: space.lg,
  },
  center: {
    textAlign: 'center',
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
});

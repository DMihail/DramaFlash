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
import { confirmUnlock, EPISODE_COST, type Wallet } from '@/domain/wallet';
import {
  coinBalanceLabel,
  insufficientCoinsDetail,
  unlockConfirmDetail,
  unlockRejectedMessage,
  unlockSavedMessage,
  unlockSaveFailedMessage,
  walletReadErrorMessage,
} from '@/features/coins/model';
import { posterArt } from '@/features/home/assets';
import { loginDestination, requestSeriesSave, seriesDestination } from '@/features/home/model';
import { useOptionalLibrarySelector } from '@/features/library/LibraryProvider';
import { librarySaveFailedMessage, progressSaveFailedMessage } from '@/features/library/model';
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
import { PlayerUnlockSheet } from '@/features/player/PlayerUnlockSheet';
import { type PlayerLoader, usePlayerEpisode } from '@/features/player/usePlayerEpisode';
import { seriesNotFoundTitle, sharingUnavailableMessage } from '@/features/series/model';
import { resolveScreenWallet } from '@/features/wallet/resolveWallet';
import { useOptionalWallet } from '@/features/wallet/WalletProvider';
import { useTransientNotice } from '@/hooks/useTransientNotice';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { testIds } from '@/testing/testIds';
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
  const shared = useOptionalWallet();
  const libraryStatus = useOptionalLibrarySelector((item) => item.status);
  const savedSeriesIds = useOptionalLibrarySelector((item) => item.savedSeriesIds);
  const toggleSave = useOptionalLibrarySelector((item) => item.toggleSave);
  const rememberEpisode = useOptionalLibrarySelector((item) => item.rememberEpisode);
  const episode = requestedEpisode(episodeParam);
  const { retry, state } = usePlayerEpisode(seriesId, episode, loadEpisode);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmedWallet, setConfirmedWallet] = useState<Wallet | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const resolved = resolveScreenWallet(confirmedWallet ?? wallet, wallet ? null : shared);
  const readyWallet = resolved.kind === 'ready' ? resolved.wallet : null;
  const openedSeriesId = state.status === 'success' ? state.data.series.id : null;
  const openedEpisode = state.status === 'success' ? state.data.episode : null;

  useEffect(() => {
    if (
      !rememberEpisode ||
      libraryStatus !== 'ready' ||
      !readyWallet ||
      openedSeriesId === null ||
      openedEpisode === null
    ) {
      return;
    }

    let active = true;
    void rememberEpisode(openedSeriesId, openedEpisode, readyWallet).then((result) => {
      if (active && result.status === 'save-failed') {
        setNotice(progressSaveFailedMessage);
      }
    });

    return () => {
      active = false;
    };
  }, [libraryStatus, openedEpisode, openedSeriesId, readyWallet, rememberEpisode]);

  useTransientNotice(notice, setNotice);

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

  if (resolved.kind === 'loading') {
    return (
      <Screen safeArea="full" testID={testIds.wallet.loading}>
        <PlayerSkeleton />
      </Screen>
    );
  }

  if (resolved.kind === 'error') {
    return (
      <PlayerMessage
        bottomInset={insets.bottom}
        detail={walletReadErrorMessage}
        onBack={handleBack}
        testID={testIds.wallet.error}
        {...(shared ? { onRetry: shared.retry } : {})}
        title="Coins are unavailable"
        topInset={insets.top}
      />
    );
  }

  if (state.status === 'loading') {
    return (
      <Screen safeArea="full">
        <PlayerSkeleton />
        <View style={[styles.overlayBack, { top: insets.top + space.sm }]}>
          <IconButton
            accessibilityLabel="Go back"
            icon={ChevronLeft}
            onPress={handleBack}
            testID={testIds.player.back}
          />
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
        testID={testIds.player.error}
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
  const activeWallet = resolved.wallet;
  const access = playerAccess(activeWallet, data.series.id, data.episode, data.series.episodeCount);
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
    setUnlockError(null);
    setUnlockOpen(true);
  };

  const handleCloseUnlock = () => {
    setUnlockOpen(false);
  };

  const handleGetCoins = () => {
    router.push(unlockDestination(data.series.id, data.episode));
  };

  const handleConfirmUnlock = () => {
    if (wallet) {
      const decision = confirmUnlock(activeWallet, data.series.id, data.episode);
      if (decision.type === 'unlocked') {
        setConfirmedWallet(decision.wallet);
        setUnlockOpen(false);
        setNotice(unlockSavedMessage);
        return;
      }

      if (decision.type === 'already-open') {
        setUnlockOpen(false);
        return;
      }

      if (decision.type === 'rejected') {
        setUnlockError(unlockRejectedMessage);
      }

      return;
    }

    if (!shared) {
      return;
    }

    void shared.unlock(data.series.id, data.episode).then((result) => {
      if (result.status === 'saved') {
        setUnlockOpen(false);
        setNotice(unlockSavedMessage);
        return;
      }

      if (result.status === 'unchanged') {
        setUnlockOpen(false);
        return;
      }

      if (result.status === 'save-failed') {
        setUnlockError(unlockSaveFailedMessage);
        return;
      }

      if (result.status === 'rejected') {
        setUnlockError(unlockRejectedMessage);
      }
    });
  };

  const handleSave = () => {
    if (!toggleSave) {
      const result = requestSeriesSave(auth, data.series.id);
      if (result.type !== 'login') {
        return;
      }

      holdLoginTicket(result.ticket);
      router.push(loginDestination());
      return;
    }

    if (libraryStatus !== 'ready') {
      return;
    }

    void toggleSave(data.series.id).then((result) => {
      if (result.status === 'save-failed') {
        setNotice(librarySaveFailedMessage);
      }
    });
  };

  const handleComments = () => {
    setNotice(commentsUnavailableMessage);
  };

  const handleShare = () => {
    void shareEpisode(data.series.title, data.episode, setNotice);
  };

  return (
    <Screen safeArea="full" frame="stage" testID={testIds.player.screen}>
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
        saved={savedSeriesIds?.includes(data.series.id) ?? false}
        balanceLabel={coinBalanceLabel(activeWallet.balance)}
        onUnlock={handleUnlock}
        preview={preview}
        showBalanceId={!unlockOpen}
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
          <AppText
            role="bodySmall"
            style={styles.noticeText}
            {...(notice === unlockSavedMessage ? { testID: testIds.player.unlockSuccess } : {})}
          >
            {notice}
          </AppText>
        </View>
      ) : null}
      {unlockOpen ? (
        <PlayerUnlockSheet
          balanceLabel={coinBalanceLabel(activeWallet.balance)}
          busy={shared?.busy ?? false}
          canAfford={activeWallet.balance >= EPISODE_COST}
          confirmLabel={
            activeWallet.balance >= EPISODE_COST
              ? `Confirm unlock · ${EPISODE_COST} coins`
              : 'Get coins'
          }
          detail={
            activeWallet.balance >= EPISODE_COST
              ? unlockConfirmDetail(activeWallet.balance)
              : insufficientCoinsDetail(activeWallet.balance)
          }
          episode={data.episode}
          error={unlockError}
          onCancel={handleCloseUnlock}
          onConfirm={handleConfirmUnlock}
          onGetCoins={handleGetCoins}
          title={data.series.title}
        />
      ) : null}
    </Screen>
  );
}

function PlayerMessage({
  bottomInset,
  detail,
  onBack,
  onRetry,
  testID,
  title,
  topInset,
}: {
  bottomInset: number;
  detail?: string;
  onBack: () => void;
  onRetry?: () => void;
  testID?: string;
  title: string;
  topInset: number;
}) {
  return (
    <Screen safeArea="full" {...(testID ? { testID } : {})}>
      <View style={[styles.statusBar, { paddingTop: topInset + space.sm }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={ChevronLeft}
          onPress={onBack}
          testID={testIds.player.back}
        />
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
        {onRetry ? (
          <PrimaryButton label="Retry" onPress={onRetry} testID={testIds.player.retry} />
        ) : null}
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

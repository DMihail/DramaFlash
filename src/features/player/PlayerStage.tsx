import { useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListVideo,
  Lock,
  type LucideIcon,
  MessageCircle,
  Pause,
  Play,
  Share2,
} from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  artworkPreviewMessage,
  canPreviewPlayback,
  lockedEpisodeMessage,
  playbackLabel,
  type PlayerPreview,
  unavailableMediaMessage,
} from '@/features/player/model';
import { type EpisodeAccess } from '@/features/series/model';
import { testIds } from '@/testing/testIds';
import {
  colors,
  control,
  gradient,
  iconSize,
  iconStroke,
  layout,
  radius,
  space,
} from '@/theme/tokens';

export function PlayerStage({
  access,
  balanceLabel,
  episode,
  image,
  nextEpisode,
  onBack,
  onComments,
  onEpisodes,
  onNext,
  onPrevious,
  onSave,
  onShare,
  onUnlock,
  preview,
  previousEpisode,
  showBalanceId = false,
  title,
  topInset,
  bottomInset,
}: {
  access: EpisodeAccess;
  balanceLabel?: string;
  episode: number;
  image?: ImageSourcePropType;
  nextEpisode: number | null;
  onBack: () => void;
  onComments: () => void;
  onEpisodes: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  onShare: () => void;
  onUnlock: () => void;
  preview: PlayerPreview;
  previousEpisode: number | null;
  showBalanceId?: boolean;
  title: string;
  topInset: number;
  bottomInset: number;
}) {
  const [session, setSession] = useState({ episode, playing: false });
  const sameEpisode = session.episode === episode;
  const playing = sameEpisode && canPreviewPlayback(access, preview) && session.playing;

  if (!sameEpisode || (session.playing && !playing)) {
    setSession({ episode, playing: false });
  }
  const locked = access === 'locked';
  const status = playerStatus(locked, episode, preview, playing);

  const handleTogglePlayback = () => {
    if (!canPreviewPlayback(access, preview)) {
      return;
    }

    setSession({ episode, playing: !session.playing });
  };

  return (
    <View style={styles.stage}>
      {preview === 'artwork' && image ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${title} artwork preview`}
          resizeMode="cover"
          source={image}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}
      <LinearGradient
        colors={gradient.playerScrim.colors}
        end={gradient.playerScrim.end}
        locations={gradient.playerScrim.locations}
        pointerEvents="none"
        start={gradient.playerScrim.start}
        style={[StyleSheet.absoluteFill, { opacity: gradient.playerScrim.opacity }]}
      />
      <View style={[styles.topBar, { paddingTop: topInset + space.sm }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={ChevronLeft}
          onPress={onBack}
          testID={testIds.player.back}
        />
        <AppText role="titleS">DramaFlash</AppText>
        <IconButton
          accessibilityLabel="Episodes"
          icon={ListVideo}
          onPress={onEpisodes}
          testID={testIds.player.episodes}
        />
      </View>
      {locked ? (
        <Pressable
          accessibilityRole="button"
          onPress={onUnlock}
          style={styles.lockCard}
          testID={testIds.player.locked}
        >
          <Lock color={colors.coin} size={iconSize.button} strokeWidth={iconStroke} />
          <AppText role="titleS">{`Unlock Episode ${episode}`}</AppText>
          <AppText role="caption" style={styles.lockCopy}>
            {lockedEpisodeMessage(episode)}
          </AppText>
        </Pressable>
      ) : null}
      <View style={[styles.bottom, { paddingBottom: bottomInset + space.lg }]}>
        <View style={styles.sideActions}>
          <SideAction
            accessibilityLabel="Save series"
            icon={Heart}
            label="Save"
            onPress={onSave}
            testID={testIds.player.save}
          />
          <SideAction
            accessibilityLabel="Comments"
            icon={MessageCircle}
            label="Comments"
            onPress={onComments}
            testID={testIds.player.comments}
          />
          <SideAction
            accessibilityLabel="Share episode"
            icon={Share2}
            label="Share"
            onPress={onShare}
            testID={testIds.player.share}
          />
        </View>
        <AppText accessibilityRole="header" role="displayM">
          {title}
        </AppText>
        <AppText role="bodySmall" testID={testIds.player.episode}>
          {`Episode ${episode}`}
        </AppText>
        {balanceLabel ? (
          <AppText role="bodySmall" {...(showBalanceId ? { testID: testIds.wallet.balance } : {})}>
            {balanceLabel}
          </AppText>
        ) : null}
        <AppText accessibilityLiveRegion="polite" role="bodySmall">
          {status}
        </AppText>
        {locked ? (
          <PrimaryButton
            icon={Lock}
            label="Unlock"
            onPress={onUnlock}
            testID={testIds.player.unlock}
            variant="player"
          />
        ) : null}
        {canPreviewPlayback(access, preview) ? (
          <PrimaryButton
            icon={playing ? Pause : Play}
            label={playing ? 'Pause' : 'Watch'}
            onPress={handleTogglePlayback}
            testID={playing ? testIds.player.pause : testIds.player.play}
            variant="player"
          />
        ) : null}
        <View style={styles.transport}>
          <TransportButton
            accessibilityLabel="Previous episode"
            disabled={previousEpisode === null}
            icon={ChevronLeft}
            label="Previous"
            onPress={onPrevious}
            testID={testIds.player.previous}
          />
          <TransportButton
            accessibilityLabel={
              nextEpisode === null ? 'Next episode' : `Next episode ${nextEpisode}`
            }
            disabled={nextEpisode === null}
            icon={ChevronRight}
            label="Next"
            onPress={onNext}
            testID={testIds.player.next}
          />
        </View>
      </View>
    </View>
  );
}

function playerStatus(
  locked: boolean,
  episode: number,
  preview: PlayerPreview,
  playing: boolean,
): string {
  if (locked) {
    return lockedEpisodeMessage(episode);
  }

  if (preview === 'unavailable') {
    return unavailableMediaMessage;
  }

  return `${playbackLabel(playing)}. ${artworkPreviewMessage}`;
}

function SideAction({
  accessibilityLabel,
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  accessibilityLabel: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.sideButton}>
        <Icon color={colors.text} size={iconSize.header} strokeWidth={iconStroke} />
        <AppText role="micro">{label}</AppText>
      </View>
    </Pressable>
  );
}

function TransportButton({
  accessibilityLabel,
  disabled,
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.transportButton}
      testID={testID}
    >
      <Icon
        color={disabled ? colors.textMuted : colors.text}
        size={iconSize.header}
        strokeWidth={iconStroke}
      />
      <AppText color={disabled ? 'textMuted' : 'text'} role="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fallback: {
    backgroundColor: colors.surfaceMedia,
  },
  topBar: {
    paddingHorizontal: layout.marginDetail,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockCard: {
    marginHorizontal: layout.marginDetail,
    marginTop: space.xxxl,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
    alignItems: 'flex-start',
  },
  lockCopy: {
    color: colors.textOnMedia,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.marginDetail,
    gap: space.md,
  },
  sideActions: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: space.lg,
  },
  sideButton: {
    alignItems: 'center',
    gap: space.xs,
    minWidth: control.icon,
    minHeight: control.icon,
  },
  transport: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
  transportButton: {
    minHeight: control.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});

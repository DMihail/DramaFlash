import { useState } from 'react';
import {
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListVideo,
  LockKeyhole,
  type LucideIcon,
  MessageCircle,
  Pause,
  Play,
  Share2,
} from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { CoverImage } from '@/components/CoverImage';
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
import { playerColumnWidth } from '@/theme/responsive';
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
  saved = false,
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
  saved?: boolean;
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
  const { width } = useWindowDimensions();
  const columnWidth = playerColumnWidth(width);

  const handleTogglePlayback = () => {
    if (!canPreviewPlayback(access, preview)) {
      return;
    }

    setSession({ episode, playing: !session.playing });
  };

  return (
    <View style={styles.stage}>
      <View style={[styles.frame, columnWidth ? { maxWidth: columnWidth } : null]}>
        {preview === 'artwork' && image ? (
          <View style={styles.art}>
            <CoverImage label={`${title} artwork preview`} source={image} />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', colors.background]}
              pointerEvents="none"
              style={styles.artFade}
            />
          </View>
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
          <IconButton
            accessibilityLabel="Episodes"
            icon={ListVideo}
            onPress={onEpisodes}
            testID={testIds.player.episodes}
          />
        </View>
        {locked ? (
          <View pointerEvents="box-none" style={styles.lockLayer}>
            <Pressable
              accessibilityRole="button"
              onPress={onUnlock}
              style={styles.lockCard}
              testID={testIds.player.locked}
            >
              <LockKeyhole color={colors.coin} size={iconSize.button} strokeWidth={iconStroke} />
              <AppText role="titleXS" style={styles.lockTitle}>
                {`Unlock Episode ${episode}`}
              </AppText>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.sideActions, { bottom: bottomInset + 148 }]}>
          <SideAction
            accessibilityLabel={saved ? 'Remove from library' : 'Save series'}
            icon={Heart}
            label={saved ? 'Saved' : 'Save'}
            onPress={onSave}
            saved={saved}
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
        <View style={[styles.bottom, { paddingBottom: bottomInset + space.lg }]}>
          <View style={styles.copy}>
            <AppText accessibilityRole="header" role="displayM">
              {title}
            </AppText>
            <AppText role="bodySmall" testID={testIds.player.episode}>
              {`Episode ${episode}`}
            </AppText>
            {balanceLabel ? (
              <AppText
                role="bodySmall"
                {...(showBalanceId ? { testID: testIds.wallet.balance } : {})}
              >
                {balanceLabel}
              </AppText>
            ) : null}
            <AppText accessibilityLiveRegion="polite" role="bodySmall">
              {status}
            </AppText>
            {locked ? (
              <View style={styles.watchWrap}>
                <PrimaryButton
                  icon={LockKeyhole}
                  label="Unlock"
                  onPress={onUnlock}
                  testID={testIds.player.unlock}
                  variant="player"
                />
              </View>
            ) : null}
            {canPreviewPlayback(access, preview) ? (
              <View style={styles.watchWrap}>
                <PrimaryButton
                  icon={playing ? Pause : Play}
                  label={playing ? 'Pause' : 'Watch'}
                  onPress={handleTogglePlayback}
                  testID={playing ? testIds.player.pause : testIds.player.play}
                  variant="player"
                />
              </View>
            ) : null}
          </View>
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
  saved = false,
  testID,
}: {
  accessibilityLabel: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  saved?: boolean;
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
        <Icon
          color={colors.text}
          size={iconSize.header}
          strokeWidth={iconStroke}
          {...(saved ? { fill: colors.primary } : {})}
        />
      </View>
      <AppText role="micro">{label}</AppText>
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

/** Space the side action column (Save, Comments, Share) takes at the right edge. */
const sideActionsClearance = 88;

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.surfaceMedia,
  },
  // Portrait artwork keeps its own shape at the top of the stage. Cover-filling
  // the full-height stage cut the painted title off at both sides.
  art: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 3 / 4,
    overflow: 'hidden',
  },
  artFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
  topBar: {
    paddingHorizontal: layout.marginDetail,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCard: {
    width: 184,
    minHeight: 126,
    padding: space.md,
    borderRadius: radius.sheetInner,
    backgroundColor: 'rgba(6, 21, 50, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.marginDetail,
    gap: space.md,
  },
  // Only the text column keeps clear of the side actions. The transport row
  // sits below them, so Previous and Next span the full width like the board.
  copy: {
    gap: space.md,
    paddingRight: sideActionsClearance - layout.marginDetail,
  },
  watchWrap: {
    alignSelf: 'flex-start',
  },
  sideActions: {
    position: 'absolute',
    right: layout.marginScreen,
    alignItems: 'center',
    gap: 20,
    zIndex: 2,
  },
  sideButton: {
    width: control.icon,
    height: control.icon,
    borderRadius: control.icon / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
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

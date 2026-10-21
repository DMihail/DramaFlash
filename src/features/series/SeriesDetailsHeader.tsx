import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ArrowUpDown, ChevronLeft, Heart, Play, Share2 } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { episodeCountLabel } from '@/features/series/model';
import { colors, control, gradient, iconSize, iconStroke, layout, space } from '@/theme/tokens';

export function SeriesDetailsHeader({
  episodeCount,
  image,
  onBack,
  onPlay,
  onSave,
  onShare,
  onSort,
  showPlay,
  showSort,
  sortLabel,
  title,
  topInset,
}: {
  episodeCount: number | null;
  image?: ImageSourcePropType;
  onBack: () => void;
  onPlay: () => void;
  onSave: () => void;
  onShare: () => void;
  onSort: () => void;
  showPlay: boolean;
  showSort: boolean;
  sortLabel: string;
  title: string;
  topInset: number;
}) {
  return (
    <View>
      <View style={styles.heroFrame}>
        {image ? (
          <Image accessibilityIgnoresInvertColors source={image} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]} />
        )}
        <LinearGradient
          colors={gradient.detailHero.colors}
          end={gradient.detailHero.end}
          locations={gradient.detailHero.locations}
          pointerEvents="none"
          start={gradient.detailHero.start}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradient.detailTopBar.colors}
          end={gradient.detailTopBar.end}
          locations={gradient.detailTopBar.locations}
          pointerEvents="none"
          start={gradient.detailTopBar.start}
          style={styles.topBarScrim}
        />
        <View style={[styles.heroBar, { paddingTop: topInset + space.sm }]}>
          <IconButton
            accessibilityLabel="Go back"
            icon={ChevronLeft}
            onPress={onBack}
            testID="series.back"
          />
          <View style={styles.heroActions}>
            <IconButton
              accessibilityLabel="Share series"
              icon={Share2}
              onPress={onShare}
              testID="series.share"
            />
            <IconButton
              accessibilityLabel="Save series"
              icon={Heart}
              onPress={onSave}
              testID="series.save"
            />
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" role="displayL" testID="series.title">
          {title}
        </AppText>
        <AppText role="bodySmall">{episodeCountLabel(episodeCount)}</AppText>
        {showPlay ? (
          <PrimaryButton
            fill
            icon={Play}
            label="Play Ep 1"
            onPress={onPlay}
            testID="series.play"
            variant="player"
          />
        ) : null}
      </View>
      <View style={styles.episodeHeading}>
        <View style={styles.episodeTitle}>
          <AppText role="titleM">Episodes</AppText>
          {episodeCount !== null ? <AppText role="caption">{episodeCount}</AppText> : null}
        </View>
        {showSort ? (
          <Pressable
            accessibilityLabel={sortLabel}
            accessibilityRole="button"
            onPress={onSort}
            style={styles.sortButton}
            testID="series.sort"
          >
            <ArrowUpDown color={colors.primary} size={iconSize.header} strokeWidth={iconStroke} />
            <AppText color="primary" role="caption">
              Sort
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroFrame: {
    width: '100%',
  },
  hero: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMedia,
  },
  topBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: gradient.detailTopBar.height,
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
    gap: space.sm,
  },
  copy: {
    paddingHorizontal: layout.marginDetail,
    paddingTop: space.xl,
    gap: space.md,
  },
  episodeHeading: {
    marginTop: space.xxl,
    paddingHorizontal: layout.marginDetail,
    paddingBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  episodeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sortButton: {
    minHeight: control.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
  },
});

import {
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { ChevronLeft, Heart, Play, Share2 } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { CoverImage } from '@/components/CoverImage';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { episodeCountLabel, type EpisodeSort } from '@/features/series/model';
import { SeriesStory } from '@/features/series/SeriesStory';
import { testIds } from '@/testing/testIds';
import { seriesHeroFrame } from '@/theme/responsive';
import { colors, control, gradient, layout, space } from '@/theme/tokens';

export function SeriesDetailsHeader({
  episodeCount,
  image,
  onBack,
  onPlay,
  onSave,
  onShare,
  saved = false,
  onSort,
  seriesId,
  showPlay,
  showSort,
  sort,
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
  saved?: boolean;
  onSort: () => void;
  seriesId: string;
  showPlay: boolean;
  showSort: boolean;
  sort: EpisodeSort;
  sortLabel: string;
  title: string;
  topInset: number;
}) {
  const { width } = useWindowDimensions();
  const frame = seriesHeroFrame(width);

  return (
    <View>
      <View style={[styles.heroFrame, { height: frame.height }]}>
        {image ? (
          <CoverImage label={`${title} artwork`} source={image} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroFallback]} />
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
            testID={testIds.series.back}
          />
          <View style={styles.heroActions}>
            <IconButton
              accessibilityLabel="Share series"
              icon={Share2}
              onPress={onShare}
              testID={testIds.series.share}
            />
            <IconButton
              accessibilityLabel={saved ? 'Remove from library' : 'Save series'}
              filled={saved}
              icon={Heart}
              onPress={onSave}
              testID={testIds.series.save}
            />
          </View>
        </View>
      </View>
      <View style={styles.copy}>
        <AppText accessibilityRole="header" role="displayL" testID={testIds.series.title}>
          {title}
        </AppText>
        <AppText role="bodySmall">{episodeCountLabel(episodeCount)}</AppText>
        {showPlay ? (
          <PrimaryButton
            fill
            icon={Play}
            label="Play Ep 1"
            onPress={onPlay}
            testID={testIds.series.play}
            variant="player"
          />
        ) : null}
      </View>
      <SeriesStory seriesId={seriesId} />
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
            testID={testIds.series.sort}
          >
            <AppText color="primary" role="caption">
              {sort === 'asc' ? 'Sort ↓' : 'Sort ↑'}
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
    alignSelf: 'center',
    overflow: 'hidden',
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

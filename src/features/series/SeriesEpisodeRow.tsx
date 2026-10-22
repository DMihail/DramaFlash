import { Image, Pressable, StyleSheet, View } from 'react-native';

import { LockKeyhole, Play } from 'lucide-react-native';

import { type SeriesEpisode } from '@/api/series';
import { AppText } from '@/components/AppText';
import { storyEpisodeTitle } from '@/data/seriesStory';
import { episodeStill } from '@/features/home/assets';
import { accessLabel, type EpisodeAccess, episodeActionLabel } from '@/features/series/model';
import { testIds } from '@/testing/testIds';
import { colors, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function SeriesEpisodeRow({
  access,
  episode,
  onPress,
  seriesId,
}: {
  access: EpisodeAccess;
  episode: SeriesEpisode;
  onPress: (episode: number) => void;
  seriesId: string;
}) {
  if (access === 'invalid') {
    return null;
  }

  const label = accessLabel(access);
  const still = episodeStill(seriesId, episode.number);
  const locked = access === 'locked';
  const handlePress = () => {
    onPress(episode.number);
  };

  return (
    <Pressable
      accessibilityLabel={episodeActionLabel(access, episode.number)}
      accessibilityRole="button"
      onPress={handlePress}
      style={styles.episodeRow}
      testID={testIds.series.episode(episode.number)}
    >
      <View style={[styles.thumb, locked ? styles.thumbLocked : null]}>
        {still ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={still}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.thumbIcon}>
          {locked ? (
            <LockKeyhole color={colors.text} size={iconSize.header} strokeWidth={iconStroke} />
          ) : (
            <Play color={colors.onPrimary} size={iconSize.header} strokeWidth={iconStroke} />
          )}
        </View>
      </View>
      <View style={styles.episodeCopy}>
        <AppText role="titleXS">{storyEpisodeTitle(seriesId, episode.number)}</AppText>
        {label ? (
          <AppText color={locked ? 'accent' : 'textSecondary'} role="caption">
            {label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  episodeRow: {
    minHeight: 80,
    marginHorizontal: layout.marginDetail,
    marginBottom: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  thumb: {
    width: 112,
    height: 63,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMedia,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLocked: {
    opacity: 0.6,
  },
  thumbIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeCopy: {
    flex: 1,
    gap: space.xs,
  },
});

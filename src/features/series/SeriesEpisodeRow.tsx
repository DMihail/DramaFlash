import { Pressable, StyleSheet, View } from 'react-native';

import { Lock, Play } from 'lucide-react-native';

import { type SeriesEpisode } from '@/api/series';
import { AppText } from '@/components/AppText';
import { accessLabel, type EpisodeAccess, episodeActionLabel } from '@/features/series/model';
import { testIds } from '@/testing/testIds';
import { colors, control, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function SeriesEpisodeRow({
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
      testID={testIds.series.episode(episode.number)}
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

const styles = StyleSheet.create({
  episodeRow: {
    minHeight: control.button,
    marginHorizontal: layout.marginDetail,
    marginBottom: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
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
    gap: space.xs,
  },
});

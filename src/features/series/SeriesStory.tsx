import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/AppText';
import {
  hasSeriesStory,
  seasonUnlockNote,
  seasonUnlockTitle,
  storyCast,
  storyHighlights,
  storyLoveTitle,
  storySynopsis,
} from '@/data/seriesStory';
import { castPortrait } from '@/features/home/assets';
import { colors, layout, radius, space } from '@/theme/tokens';

export function SeriesStory({ seriesId }: { seriesId: string }) {
  if (!hasSeriesStory(seriesId)) {
    return null;
  }

  return (
    <View style={styles.block}>
      <AppText role="titleM">Synopsis</AppText>
      <AppText role="bodySmall">{storySynopsis}</AppText>
      <View style={styles.loveCard}>
        <View style={styles.loveTitle}>
          <View style={styles.loveMark} />
          <AppText role="titleS">{storyLoveTitle}</AppText>
        </View>
        {storyHighlights.map((line) => (
          <View key={line} style={styles.loveRow}>
            <View style={styles.loveDot} />
            <AppText role="bodySmall" style={styles.loveCopy}>
              {line}
            </AppText>
          </View>
        ))}
      </View>
      <AppText role="titleM">Cast & Crew</AppText>
      <ScrollView
        horizontal
        contentContainerStyle={styles.castRow}
        showsHorizontalScrollIndicator={false}
      >
        {storyCast.map((person) => (
          <View key={person.id} style={styles.castItem}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={person.name}
              resizeMode="cover"
              source={castPortrait(person.id)}
              style={styles.castPhoto}
            />
            <AppText numberOfLines={1} role="titleXS">
              {person.name}
            </AppText>
            <AppText numberOfLines={2} role="micro">
              {person.role}
            </AppText>
          </View>
        ))}
      </ScrollView>
      <LinearGradient
        colors={[colors.surface, 'rgba(52, 4, 73, 0.45)']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.season}
      >
        <View style={styles.seasonCopy}>
          <AppText role="titleS">{seasonUnlockTitle}</AppText>
          <AppText role="caption">{seasonUnlockNote}</AppText>
        </View>
        <View style={styles.seasonPill}>
          <AppText role="micro" style={styles.seasonPillText}>
            Unavailable
          </AppText>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: layout.marginDetail,
    paddingTop: space.xxl,
    gap: space.md,
  },
  loveCard: {
    borderRadius: radius.card,
    backgroundColor: 'rgba(24, 23, 43, 0.4)',
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  loveTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  loveMark: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  loveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  loveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  loveCopy: {
    flex: 1,
    color: colors.textSecondary,
  },
  castRow: {
    gap: space.lg,
    paddingRight: space.lg,
  },
  castItem: {
    width: 88,
    alignItems: 'center',
    gap: space.xs,
  },
  castPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMedia,
  },
  season: {
    minHeight: 78,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  seasonCopy: {
    flex: 1,
    gap: space.xs,
  },
  seasonPill: {
    borderRadius: radius.sheetInner,
    backgroundColor: colors.accent,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
  },
  seasonPillText: {
    color: colors.onAccent,
    fontWeight: '700',
  },
});

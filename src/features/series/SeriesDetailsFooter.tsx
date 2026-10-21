import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PosterCard } from '@/components/PosterCard';
import { type Series } from '@/data/catalog';
import { posterArt } from '@/features/home/assets';
import { continueMessage, continueTitle, episodeMetaLabel } from '@/features/series/model';
import { colors, control, layout, radius, space } from '@/theme/tokens';

export function SeriesDetailsFooter({
  canToggle,
  expanded,
  nextLocked,
  onContinue,
  onOpenRecommendation,
  onToggle,
  recommendations,
}: {
  canToggle: boolean;
  expanded: boolean;
  nextLocked: number | null;
  onContinue: () => void;
  onOpenRecommendation: (seriesId: string) => void;
  onToggle: () => void;
  recommendations: readonly Series[];
}) {
  return (
    <View>
      {canToggle ? (
        <Pressable accessibilityRole="button" onPress={onToggle} style={styles.showMore}>
          <AppText color="textSecondary" role="bodySmall">
            {expanded ? 'Show less' : 'Show more episodes'}
          </AppText>
        </Pressable>
      ) : null}
      {nextLocked !== null ? (
        <Pressable accessibilityRole="button" onPress={onContinue} style={styles.continueCard}>
          <View style={styles.continueCopy}>
            <AppText role="titleS">{continueTitle}</AppText>
            <AppText role="caption">{continueMessage(nextLocked)}</AppText>
          </View>
        </Pressable>
      ) : null}
      {recommendations.length > 0 ? (
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
            {recommendations.map((series) => {
              const image = posterArt(series.id);
              const meta = episodeMetaLabel(series.episodeCount);
              return (
                <PosterCard
                  key={series.id}
                  onPress={() => onOpenRecommendation(series.id)}
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
  );
}

const styles = StyleSheet.create({
  showMore: {
    minHeight: control.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCard: {
    marginHorizontal: layout.marginDetail,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueCopy: {
    gap: space.sm,
  },
  recommendations: {
    marginTop: space.xxxl,
    gap: space.lg,
  },
  sectionTitle: {
    paddingHorizontal: layout.marginDetail,
  },
  rail: {
    paddingHorizontal: layout.marginDetail,
    flexDirection: 'row',
    gap: space.md,
  },
});

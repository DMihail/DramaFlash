import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { GenreChip } from '@/components/GenreChip';
import { GradientTitle } from '@/components/GradientTitle';
import { PosterCard } from '@/components/PosterCard';
import { SectionHeader } from '@/components/SectionHeader';
import { posterArt } from '@/features/home/assets';
import {
  emptyCategoryMessage,
  episodeMeta,
  type HomeGenre,
  homeGenres,
  postersFor,
  visibleRails,
} from '@/features/home/model';
import { testIds } from '@/testing/testIds';
import { colors, layout, space } from '@/theme/tokens';

export function HomeCatalog({
  genre,
  onGenreChange,
  onOpenSeries,
  onSeeAll,
}: {
  genre: HomeGenre;
  onGenreChange: (genre: HomeGenre) => void;
  onOpenSeries: (seriesId: string) => void;
  onSeeAll: (category: string) => void;
}) {
  const rails = visibleRails(genre);

  return (
    <View style={styles.catalog}>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
      >
        {homeGenres.map((item) => (
          <GenreChip
            key={item}
            label={item}
            onPress={() => onGenreChange(item)}
            selected={item === genre}
            testID={testIds.home.genre(item)}
          />
        ))}
      </ScrollView>
      {rails.length === 0 ? (
        <AppText role="body" style={styles.empty}>
          {emptyCategoryMessage}
        </AppText>
      ) : (
        rails.map((rail) => (
          <View key={rail.id} style={styles.section}>
            {rail.groupLabel ? (
              <View style={styles.group}>
                <View style={styles.marker} />
                {rail.groupLabel === 'Romance' ? (
                  <GradientTitle size={24}>{rail.groupLabel}</GradientTitle>
                ) : (
                  <AppText role="displayM">{rail.groupLabel}</AppText>
                )}
              </View>
            ) : null}
            <SectionHeader
              actionLabel="See all"
              onActionPress={() => onSeeAll(rail.genre)}
              testID={testIds.home.seeAll(rail.id)}
              title={rail.title}
            />
            <ScrollView
              contentContainerStyle={styles.rail}
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
            >
              {postersFor(rail.seriesIds).map((poster) => {
                const image = posterArt(poster.id);
                const meta = episodeMeta(poster.episodeCount);

                return (
                  <PosterCard
                    key={poster.id}
                    onPress={() => onOpenSeries(poster.id)}
                    testID={testIds.home.poster(poster.id)}
                    title={poster.title}
                    variant="rail"
                    {...(image ? { image } : {})}
                    {...(meta ? { meta } : {})}
                  />
                );
              })}
            </ScrollView>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catalog: {
    paddingTop: space.lg,
    gap: space.xxxl,
    paddingBottom: space.xxxl,
  },
  chips: {
    paddingHorizontal: layout.marginScreen,
    gap: space.sm,
  },
  empty: {
    paddingHorizontal: layout.marginScreen,
    color: colors.textSecondary,
  },
  section: {
    gap: space.md,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: layout.marginScreen,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  rail: {
    gap: space.lg,
  },
});

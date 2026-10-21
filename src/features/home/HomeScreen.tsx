import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { posterArt } from '@/features/home/assets';
import { HomeCatalog } from '@/features/home/HomeCatalog';
import { HomeHeader } from '@/features/home/HomeHeader';
import { HomeHero } from '@/features/home/HomeHero';
import {
  caughtUpMessage,
  discoverDestination,
  type HomeGenre,
  homeSpotlight,
  loginDestination,
  profileDestination,
  requestSeriesSave,
  searchDestination,
  seriesDestination,
} from '@/features/home/model';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { colors, radius, space } from '@/theme/tokens';

export function HomeScreen() {
  const [genre, setGenre] = useState<HomeGenre>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const spotlight = homeSpotlight();

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <Screen safeArea="tabs">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HomeHeader
          onNotifications={() => setNotice(caughtUpMessage)}
          onProfile={() => router.navigate(profileDestination())}
          onSearch={() => router.navigate(searchDestination())}
        />
        {spotlight ? (
          <HomeHero
            episodeLabel={spotlight.episodeLabel}
            image={posterArt(spotlight.seriesId)}
            onSave={() => {
              const result = requestSeriesSave(null, spotlight.seriesId);
              if (result.type !== 'login') {
                return;
              }

              holdLoginTicket(result.ticket);
              router.push(loginDestination());
            }}
            onWatch={() => router.push(seriesDestination(spotlight.seriesId))}
            title={spotlight.title}
          />
        ) : null}
        <HomeCatalog
          genre={genre}
          onGenreChange={setGenre}
          onOpenSeries={(seriesId) => router.push(seriesDestination(seriesId))}
          onSeeAll={(category) => router.navigate(discoverDestination(category))}
        />
      </ScrollView>
      {notice ? (
        <View accessibilityLiveRegion="polite" style={styles.notice}>
          <AppText role="bodySmall" style={styles.noticeText}>
            {notice}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space[16],
  },
  notice: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  noticeText: {
    color: colors.text,
  },
});

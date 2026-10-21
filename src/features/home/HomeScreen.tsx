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
import { testIds } from '@/testing/testIds';
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

  const handleProfile = () => {
    router.navigate(profileDestination());
  };

  const handleSearch = () => {
    router.navigate(searchDestination());
  };

  const handleWatch = () => {
    if (!spotlight) {
      return;
    }

    router.push(seriesDestination(spotlight.seriesId));
  };

  const handleSave = () => {
    if (!spotlight) {
      return;
    }

    const result = requestSeriesSave(null, spotlight.seriesId);
    if (result.type !== 'login') {
      return;
    }

    holdLoginTicket(result.ticket);
    router.push(loginDestination());
  };

  const handleOpenSeries = (seriesId: string) => {
    router.push(seriesDestination(seriesId));
  };

  const handleSeeAll = (category: string) => {
    router.navigate(discoverDestination(category));
  };

  return (
    <Screen safeArea="tabs" testID={testIds.home.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HomeHeader
          onNotifications={() => setNotice(caughtUpMessage)}
          onProfile={handleProfile}
          onSearch={handleSearch}
        />
        {spotlight ? (
          <HomeHero
            episodeLabel={spotlight.episodeLabel}
            image={posterArt(spotlight.seriesId)}
            onSave={handleSave}
            onWatch={handleWatch}
            title={spotlight.title}
          />
        ) : null}
        <HomeCatalog
          genre={genre}
          onGenreChange={setGenre}
          onOpenSeries={handleOpenSeries}
          onSeeAll={handleSeeAll}
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
    paddingBottom: space.lg,
  },
  notice: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  noticeText: {
    color: colors.text,
  },
});

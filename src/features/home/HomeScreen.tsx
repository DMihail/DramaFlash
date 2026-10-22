import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { homeHeroArt } from '@/features/home/assets';
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
import { useOptionalLibrarySelector } from '@/features/library/LibraryProvider';
import { librarySaveFailedMessage } from '@/features/library/model';
import { useTransientNotice } from '@/hooks/useTransientNotice';
import { holdLoginTicket } from '@/navigation/pendingLogin';
import { testIds } from '@/testing/testIds';
import { colors, radius, space } from '@/theme/tokens';

export function HomeScreen() {
  const [genre, setGenre] = useState<HomeGenre>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const spotlight = homeSpotlight();
  const libraryStatus = useOptionalLibrarySelector((state) => state.status);
  const savedSeriesIds = useOptionalLibrarySelector((state) => state.savedSeriesIds);
  const toggleSave = useOptionalLibrarySelector((state) => state.toggleSave);
  const spotlightSaved = spotlight
    ? (savedSeriesIds?.includes(spotlight.seriesId) ?? false)
    : false;

  useTransientNotice(notice, setNotice);

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

    if (!toggleSave) {
      const result = requestSeriesSave(null, spotlight.seriesId);
      if (result.type !== 'login') {
        return;
      }

      holdLoginTicket(result.ticket);
      router.push(loginDestination());
      return;
    }

    if (libraryStatus !== 'ready') {
      return;
    }

    void toggleSave(spotlight.seriesId).then((result) => {
      if (result.status === 'save-failed') {
        setNotice(librarySaveFailedMessage);
      }
    });
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
        {/* The board puts the header above the hero. Overlaid, it covered the title painted into the artwork. */}
        <HomeHeader
          onNotifications={() => setNotice(caughtUpMessage)}
          onProfile={handleProfile}
          onSearch={handleSearch}
        />
        {spotlight ? (
          <HomeHero
            episodeLabel={spotlight.episodeLabel}
            image={homeHeroArt}
            onSave={handleSave}
            onWatch={handleWatch}
            saved={spotlightSaved}
            tagline={spotlight.tagline}
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

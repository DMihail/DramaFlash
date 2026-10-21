import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { guestAuth } from '@/domain/auth';
import { HomeCatalog } from '@/features/home/HomeCatalog';
import { HomeHeader } from '@/features/home/HomeHeader';
import { HomeHero } from '@/features/home/HomeHero';
import {
  caughtUpMessage,
  discoverDestination,
  type HomeGenre,
  homeHero,
  loginDestination,
  profileDestination,
  saveSeries,
  searchDestination,
  seriesDestination,
  spotlightMessage,
  watchNowDestination,
} from '@/features/home/model';
import { colors, radius, space } from '@/theme/tokens';

export function HomeScreen() {
  const [genre, setGenre] = useState<HomeGenre>('All');
  const [notice, setNotice] = useState<string | null>(null);

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
        <HomeHero
          onSave={() => {
            const result = saveSeries(guestAuth(), homeHero.seriesId);
            if (result.type === 'login') {
              router.push(loginDestination());
            }
          }}
          onWatch={() => {
            const destination = watchNowDestination(homeHero.seriesId);
            if (!destination) {
              setNotice(spotlightMessage);
              return;
            }

            router.push(destination);
          }}
        />
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

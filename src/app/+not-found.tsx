import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { space } from '@/theme/tokens';

const notFoundTitle = 'Page not found';
const notFoundDetail = 'This link does not open a DramaFlash screen.';
const notFoundAction = 'Go to Home';

/** Replaces Expo Router's default unmatched-route page, which links a sitemap. */
export default function NotFoundScreen() {
  return (
    <Screen safeArea="stack">
      <View style={styles.content}>
        <AppText role="displayM" style={styles.center}>
          {notFoundTitle}
        </AppText>
        <AppText role="body" style={styles.center}>
          {notFoundDetail}
        </AppText>
        <PrimaryButton label={notFoundAction} onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
    gap: space.md,
  },
  center: {
    textAlign: 'center',
  },
});

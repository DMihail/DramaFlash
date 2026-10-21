import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen, type ScreenSafeArea } from '@/components/Screen';
import { space } from '@/theme/tokens';

export function Placeholder({
  title,
  detail,
  safeArea,
  testID,
}: {
  title: string;
  detail?: string;
  safeArea: ScreenSafeArea;
  testID?: string;
}) {
  return (
    <Screen safeArea={safeArea} {...(testID ? { testID } : {})}>
      <View style={styles.content}>
        <AppText role="displayM" style={styles.center}>
          {title}
        </AppText>
        {detail ? (
          <AppText role="body" style={styles.center}>
            {detail}
          </AppText>
        ) : null}
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
    gap: space.sm,
  },
  center: {
    textAlign: 'center',
  },
});

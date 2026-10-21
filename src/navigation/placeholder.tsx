import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { space } from '@/theme/tokens';

export function Placeholder({ title, detail }: { title: string; detail?: string }) {
  return (
    <Screen>
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
    padding: space[24],
    gap: space[8],
  },
  center: {
    textAlign: 'center',
  },
});

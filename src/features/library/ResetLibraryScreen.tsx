import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { useLibrarySelector } from '@/features/library/LibraryProvider';
import { testIds } from '@/testing/testIds';
import { layout, space } from '@/theme/tokens';

export function ResetLibraryScreen() {
  const status = useLibrarySelector((state) => state.status);
  const resetLibrary = useLibrarySelector((state) => state.resetLibrary);
  const [phase, setPhase] = useState<'working' | 'done' | 'failed'>('working');
  const started = useRef(false);

  useEffect(() => {
    if (started.current || status === 'loading') {
      return;
    }

    started.current = true;
    void resetLibrary().then((result) => {
      setPhase(result === 'reset' ? 'done' : 'failed');
    });
  }, [resetLibrary, status]);

  if (phase !== 'done') {
    return (
      <Screen safeArea="stack" testID={testIds.library.loading}>
        <View style={styles.body}>
          <Skeleton height={24} width={180} />
          {phase === 'failed' ? (
            <AppText role="body">The library could not be reset.</AppText>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea="stack" testID={testIds.library.reset}>
      <View style={styles.body}>
        <AppText role="titleS">Library reset</AppText>
        <AppText role="bodySmall">Saved series and continue watching were cleared.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: space.md,
    padding: layout.marginScreen,
  },
});

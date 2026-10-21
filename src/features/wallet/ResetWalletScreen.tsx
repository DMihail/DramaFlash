import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { useWallet } from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';
import { layout, space } from '@/theme/tokens';

export function ResetWalletScreen() {
  const wallet = useWallet();
  const [phase, setPhase] = useState<'working' | 'done' | 'failed'>('working');
  const started = useRef(false);

  useEffect(() => {
    if (started.current || wallet.status === 'loading') {
      return;
    }

    started.current = true;
    void wallet.resetDemo().then((result) => {
      setPhase(result === 'reset' ? 'done' : 'failed');
    });
  }, [wallet]);

  if (phase !== 'done') {
    return (
      <Screen safeArea="stack" testID={testIds.wallet.loading}>
        <View style={styles.body}>
          <Skeleton height={24} width={180} />
          {phase === 'failed' ? (
            <AppText role="body">The demo wallet could not be reset.</AppText>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea="stack" testID={testIds.wallet.reset}>
      <View style={styles.body}>
        <AppText role="titleS">Demo wallet reset</AppText>
        <AppText role="bodySmall">15 coins. Paid episodes are locked again.</AppText>
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

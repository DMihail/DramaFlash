import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import { layout, space } from '@/theme/tokens';

export function PlayerSkeleton() {
  return (
    <View
      accessibilityLabel="Loading episode"
      accessibilityState={{ busy: true }}
      accessible
      testID="player.loading"
    >
      <Skeleton height={640} radius={0} width="100%" />
      <View style={styles.copy}>
        <Skeleton height={28} width="70%" />
        <Skeleton height={16} width="40%" />
        <Skeleton height={48} radius={24} width="100%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    position: 'absolute',
    left: layout.marginDetail,
    right: layout.marginDetail,
    bottom: space.section,
    gap: space.md,
  },
});

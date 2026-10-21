import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/Skeleton';
import { layout, radius, space } from '@/theme/tokens';

const episodePlaceholders = [0, 1, 2, 3, 4, 5] as const;

export function SeriesDetailsSkeleton() {
  return (
    <View accessibilityLabel="Loading series" accessibilityState={{ busy: true }} accessible>
      <Skeleton height={420} radius={0} width="100%" />
      <View style={styles.copy}>
        <Skeleton height={32} width="72%" />
        <Skeleton height={16} width="28%" />
        <Skeleton height={48} radius={24} width="100%" />
        <Skeleton height={22} width="40%" />
        {episodePlaceholders.map((item) => (
          <Skeleton height={56} key={item} radius={radius.lg} width="100%" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    paddingHorizontal: layout.marginDetail,
    paddingTop: space[20],
    gap: space[12],
  },
});

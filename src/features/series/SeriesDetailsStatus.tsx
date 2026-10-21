import { StyleSheet, View } from 'react-native';

import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SeriesDetailsSkeleton } from '@/features/series/SeriesDetailsSkeleton';
import { testIds } from '@/testing/testIds';
import { layout, space } from '@/theme/tokens';

export function SeriesDetailsLoading({
  topInset,
  onBack,
}: {
  topInset: number;
  onBack: () => void;
}) {
  return (
    <Screen safeArea="full">
      <SeriesDetailsSkeleton />
      <View style={[styles.overlayBack, { top: topInset + space.sm }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={ChevronLeft}
          onPress={onBack}
          testID={testIds.series.back}
        />
      </View>
    </Screen>
  );
}

export function SeriesDetailsMessage({
  detail,
  onBack,
  onRetry,
  title,
  topInset,
}: {
  detail?: string;
  onBack: () => void;
  onRetry?: () => void;
  title: string;
  topInset: number;
}) {
  return (
    <Screen safeArea="full">
      <View style={[styles.statusBar, { paddingTop: topInset + space.sm }]}>
        <IconButton
          accessibilityLabel="Go back"
          icon={ChevronLeft}
          onPress={onBack}
          testID={testIds.series.back}
        />
      </View>
      <View style={styles.statusBody}>
        <AppText role="displayM" style={styles.center}>
          {title}
        </AppText>
        {detail ? (
          <AppText role="body" style={styles.center}>
            {detail}
          </AppText>
        ) : null}
        {onRetry ? (
          <PrimaryButton label="Retry" onPress={onRetry} testID={testIds.series.retry} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlayBack: {
    position: 'absolute',
    left: layout.marginDetail,
  },
  statusBar: {
    paddingHorizontal: layout.marginDetail,
  },
  statusBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.marginDetail,
    gap: space.lg,
  },
  center: {
    textAlign: 'center',
  },
});

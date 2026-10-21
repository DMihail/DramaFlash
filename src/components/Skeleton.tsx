import { View, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

export function Skeleton({
  height,
  width,
  radius: corner = radius.md,
  style,
}: {
  height: number;
  width: ViewStyle['width'];
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height,
          width,
          borderRadius: corner,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    />
  );
}

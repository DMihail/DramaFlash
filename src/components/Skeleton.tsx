import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

export const skeletonPulseMs = 900;

export const skeletonOpacity = {
  visible: 1,
  dim: 0.55,
} as const;

export function skeletonMotion(reducedMotion: boolean): 'pulse' | 'static' {
  return reducedMotion ? 'static' : 'pulse';
}

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
  const [opacity] = useState(() => new Animated.Value(skeletonOpacity.visible));
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const motion = reducedMotion === null ? 'static' : skeletonMotion(reducedMotion);

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) {
          setReducedMotion(value);
        }
      })
      .catch(() => {
        if (active) {
          setReducedMotion(false);
        }
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (motion !== 'pulse') {
      opacity.setValue(skeletonOpacity.visible);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: skeletonOpacity.dim,
          duration: skeletonPulseMs,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: skeletonOpacity.visible,
          duration: skeletonPulseMs,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      animation.stop();
      opacity.setValue(skeletonOpacity.visible);
    };
  }, [motion, opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bone, { height, width, borderRadius: corner, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: colors.surface,
  },
});

import { useId } from 'react';

import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { colors, fontFamily } from '@/theme/tokens';

/**
 * Serif title filled with the brand gradient.
 *
 * React Native has no gradient text style. SVG is already in the app, so this
 * stays free of a mask library.
 */
export function GradientTitle({ children, size = 24 }: { children: string; size?: number }) {
  const gradientId = `brandTitle${useId().replace(/:/g, '')}`;
  const width = Math.ceil(children.length * size * 0.72);
  const height = Math.ceil(size * 1.3);

  return (
    <Svg accessibilityLabel={children} accessibilityRole="header" height={height} width={width}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.accent} />
        </LinearGradient>
      </Defs>
      <SvgText
        fill={`url(#${gradientId})`}
        fontFamily={fontFamily.playfair}
        fontSize={size}
        fontWeight="700"
        y={size}
      >
        {children}
      </SvgText>
    </Svg>
  );
}

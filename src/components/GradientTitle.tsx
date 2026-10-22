import { useId } from 'react';
import { View } from 'react-native';

import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { colors, fontFamily } from '@/theme/tokens';

/**
 * Serif title filled with the brand gradient.
 *
 * React Native has no gradient text style. SVG is already in the app, so this
 * stays free of a mask library. The header role stays on the wrapper. Putting
 * it on the SVG makes web render a heading, and the gradient fill is then ignored.
 * The box width is an estimate, so a centered layout must pass `align="center"`.
 */
export function GradientTitle({
  align = 'start',
  children,
  size = 24,
}: {
  /** `center` centers the text inside its estimated box, for centered layouts. */
  align?: 'start' | 'center';
  children: string;
  size?: number;
}) {
  const gradientId = `brandTitle${useId().replace(/:/g, '')}`;
  const width = Math.ceil(children.length * size * 0.72);
  const height = Math.ceil(size * 1.3);

  return (
    <View accessibilityLabel={children} accessibilityRole="header">
      <Svg height={height} width={width}>
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
          textAnchor={align === 'center' ? 'middle' : 'start'}
          x={align === 'center' ? width / 2 : 0}
          y={size}
        >
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}

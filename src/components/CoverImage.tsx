import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { fillFrame } from '@/components/fillFrame';

/**
 * Fills a frame without stretching the artwork.
 *
 * Native `Image` cover crops from the center. The web file applies
 * `coverPosition` from `coverCrop.ts`. Width and height stay `100%` so React
 * Native Web does not keep the asset's pixel size.
 */
export function CoverImage({
  label,
  source,
  style,
}: {
  label?: string;
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      source={source}
      style={[fillFrame, style]}
      {...(label ? { accessibilityLabel: label } : {})}
    />
  );
}

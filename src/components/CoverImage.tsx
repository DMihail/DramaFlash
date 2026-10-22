import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';

/**
 * Fills a frame without stretching the artwork.
 *
 * Native `Image` cover crops from the center. The web file applies
 * `coverPosition` from `coverCrop.ts`.
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
      style={[styles.cover, style]}
      {...(label ? { accessibilityLabel: label } : {})}
    />
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: '100%',
  },
});

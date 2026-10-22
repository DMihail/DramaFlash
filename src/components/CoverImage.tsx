import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  Platform,
  type StyleProp,
  StyleSheet,
} from 'react-native';

const webCrop = { objectFit: 'cover', objectPosition: 'center 18%' } as ImageStyle;

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
      style={[styles.cover, Platform.OS === 'web' ? webCrop : null, style]}
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

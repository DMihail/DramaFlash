import { createElement } from 'react';
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';

import { Asset } from 'expo-asset';

import { coverPosition } from '@/components/coverCrop';

/**
 * Web cover crop. React Native Web paints `Image` as a background locked to
 * the center, so `objectPosition` on that component does not move the subject.
 * This file is the web build only. A missing URI falls back to `Image`.
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
  const uri = assetUri(source);
  const flat = StyleSheet.flatten([styles.cover, style]);

  if (!uri) {
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

  return createElement('img', {
    alt: label ?? '',
    src: uri,
    style: {
      ...flat,
      objectFit: 'cover',
      objectPosition: coverPosition,
    },
  });
}

function assetUri(source: ImageSourcePropType): string | null {
  const moduleId = assetModule(source);
  if (moduleId === null) {
    return null;
  }

  try {
    const uri = Asset.fromModule(moduleId).uri;
    return uri.length > 0 ? uri : null;
  } catch {
    return null;
  }
}

function assetModule(source: ImageSourcePropType): number | string | null {
  if (typeof source === 'number' || typeof source === 'string') {
    return source;
  }

  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }

  return null;
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: '100%',
  },
});

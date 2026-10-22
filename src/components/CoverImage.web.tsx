import { createElement } from 'react';
import * as ReactNative from 'react-native';
import {
  Image,
  type ImageSourcePropType,
  type ImageStyle,
  PixelRatio,
  type StyleProp,
  StyleSheet,
} from 'react-native';

import { coverPosition } from '@/components/coverCrop';

type PackagedAsset = {
  httpServerLocation: string;
  name: string;
  scales: number[];
  type: string;
};

type AssetRegistryModule = {
  getAssetByID: (id: number) => PackagedAsset | undefined;
};

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
  if (typeof source === 'number') {
    return uriForAsset(assetRegistry()?.getAssetByID(source));
  }

  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return source.uri;
  }

  return null;
}

function assetRegistry(): AssetRegistryModule | null {
  const moduleObject: object = ReactNative;
  if (!('AssetRegistry' in moduleObject)) {
    return null;
  }

  const registry: unknown = (moduleObject as { AssetRegistry?: unknown }).AssetRegistry;
  if (
    typeof registry !== 'object' ||
    registry === null ||
    !('getAssetByID' in registry) ||
    typeof registry.getAssetByID !== 'function'
  ) {
    return null;
  }

  return registry as AssetRegistryModule;
}

function uriForAsset(asset: PackagedAsset | undefined): string | null {
  if (!asset || asset.scales.length === 0) {
    return null;
  }

  const preferredScale = PixelRatio.get();
  const scale = asset.scales.reduce((closest, candidate) =>
    Math.abs(candidate - preferredScale) < Math.abs(closest - preferredScale) ? candidate : closest,
  );
  const scaleSuffix = scale !== 1 ? `@${scale}x` : '';

  return `${asset.httpServerLocation}/${asset.name}${scaleSuffix}.${asset.type}`;
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: '100%',
  },
});

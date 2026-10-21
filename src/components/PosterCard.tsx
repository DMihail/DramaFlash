import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, layout, radius, space } from '@/theme/tokens';

export type PosterVariant = 'rail' | 'grid';

export function posterSize(variant: PosterVariant): { width: number; height: number } {
  return variant === 'grid' ? layout.posterGrid : layout.posterRail;
}

export function PosterCard({
  title,
  image,
  meta,
  variant = 'rail',
  onPress,
  testID,
}: {
  title: string;
  image?: ImageSourcePropType;
  meta?: string;
  variant?: PosterVariant;
  onPress?: () => void;
  testID?: string;
}) {
  const size = posterSize(variant);
  const art = image ? (
    <Image accessibilityIgnoresInvertColors source={image} style={[styles.image, size]} />
  ) : (
    <View style={[styles.image, styles.placeholder, size]} />
  );
  const caption = (
    <View style={{ width: size.width }} {...(!onPress && testID ? { testID } : {})}>
      {art}
      <AppText numberOfLines={2} role="titleXS" style={styles.title}>
        {title}
      </AppText>
      {meta ? (
        <AppText numberOfLines={1} role="micro" style={styles.meta}>
          {meta}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) {
    return caption;
  }

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      {...(testID ? { testID } : {})}
    >
      {caption}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    backgroundColor: colors.surfaceMedia,
  },
  title: {
    marginTop: space.md,
  },
  meta: {
    marginTop: space.xs,
    color: colors.textMeta,
  },
});

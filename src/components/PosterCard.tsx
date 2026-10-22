import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

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
  size,
  onPress,
  testID,
}: {
  title: string;
  image?: ImageSourcePropType;
  meta?: string;
  variant?: PosterVariant;
  size?: { width: number; height: number };
  onPress?: () => void;
  testID?: string;
}) {
  const measured = size ?? posterSize(variant);
  const caption = (
    <View style={{ width: measured.width }} {...(!onPress && testID ? { testID } : {})}>
      <View style={[styles.image, measured]}>
        {image ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={image}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
        {meta ? (
          <LinearGradient colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.82)']} style={styles.scrim}>
            <AppText numberOfLines={1} role="micro" style={styles.scrimText}>
              {meta}
            </AppText>
          </LinearGradient>
        ) : null}
      </View>
      <AppText numberOfLines={2} role="titleXS" style={styles.title}>
        {title}
      </AppText>
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
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.surfaceMedia,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 47,
    justifyContent: 'flex-end',
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
  },
  scrimText: {
    color: colors.text,
  },
  title: {
    marginTop: space.md,
  },
});

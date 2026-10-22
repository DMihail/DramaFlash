import { type ImageSourcePropType, StyleSheet, useWindowDimensions, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Check, Play, Plus } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { CoverImage } from '@/components/CoverImage';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { testIds } from '@/testing/testIds';
import { homeHeroFrame } from '@/theme/responsive';
import { colors, gradient, layout, radius, space } from '@/theme/tokens';

export function HomeHero({
  episodeLabel,
  image,
  onSave,
  onWatch,
  saved = false,
  title,
}: {
  episodeLabel: string;
  image: ImageSourcePropType | undefined;
  onSave: () => void;
  onWatch: () => void;
  saved?: boolean;
  title: string;
}) {
  const { width } = useWindowDimensions();
  const frame = homeHeroFrame(width);

  return (
    <View style={[styles.hero, { height: frame.height }]}>
      {image ? (
        <CoverImage label={`${title} artwork`} source={image} style={StyleSheet.absoluteFill} />
      ) : null}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.tint} />
        <LinearGradient
          colors={gradient.homeHeroTop.colors}
          end={gradient.homeHeroTop.end}
          locations={gradient.homeHeroTop.locations}
          start={gradient.homeHeroTop.start}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradient.homeHeroBottom.colors}
          end={gradient.homeHeroBottom.end}
          locations={gradient.homeHeroBottom.locations}
          start={gradient.homeHeroBottom.start}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.copy}>
        <View style={styles.spotlight}>
          <AppText role="caption" style={styles.spotlightLabel}>
            Spotlight
          </AppText>
        </View>
        <AppText role="displayXL">{title}</AppText>
        <AppText role="bodySmall" style={styles.metaText}>
          {episodeLabel}
        </AppText>
        <View style={styles.actions}>
          <View style={styles.watch}>
            <PrimaryButton
              fill
              icon={Play}
              label="Watch now"
              onPress={onWatch}
              testID={testIds.home.watchNow}
            />
          </View>
          <IconButton
            accessibilityLabel={saved ? 'Remove from library' : 'Add to library'}
            icon={saved ? Check : Plus}
            onPress={onSave}
            testID={testIds.home.save}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: gradient.homeHeroTint,
  },
  copy: {
    paddingHorizontal: layout.marginHero,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  spotlight: {
    alignSelf: 'flex-start',
    minHeight: 22,
    borderRadius: radius.lg,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(203, 100, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(203, 100, 247, 0.3)',
  },
  spotlightLabel: {
    color: colors.accent,
    fontWeight: '700',
  },
  metaText: {
    color: colors.textOnMedia,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.sm,
  },
  watch: {
    flex: 1,
  },
});

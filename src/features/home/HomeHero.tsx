import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { Play, Plus } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, layout, radius, space } from '@/theme/tokens';

export function HomeHero({
  episodeLabel,
  image,
  onSave,
  onWatch,
  title,
}: {
  episodeLabel: string;
  image: ImageSourcePropType | undefined;
  onSave: () => void;
  onWatch: () => void;
  title: string;
}) {
  return (
    <View style={styles.hero}>
      {image ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${title} artwork`}
          resizeMode="cover"
          source={image}
          style={styles.art}
        />
      ) : null}
      <View pointerEvents="none" style={styles.scrim}>
        <View style={[styles.scrimBand, styles.scrimClear]} />
        <View style={[styles.scrimBand, styles.scrimMid]} />
        <View style={[styles.scrimBand, styles.scrimDeep]} />
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
            <PrimaryButton fill icon={Play} label="Watch now" onPress={onWatch} />
          </View>
          <IconButton accessibilityLabel="Add to library" icon={Plus} onPress={onSave} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    aspectRatio: 390 / 520,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  art: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
  },
  scrimBand: {
    width: '100%',
  },
  scrimClear: {
    flex: 1.2,
  },
  scrimMid: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  scrimDeep: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  copy: {
    paddingHorizontal: layout.marginHero,
    paddingBottom: space[20],
    gap: space[8],
  },
  spotlight: {
    alignSelf: 'flex-start',
    minHeight: 22,
    borderRadius: radius.lg,
    paddingHorizontal: space[8],
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
    gap: space[12],
    marginTop: space[8],
  },
  watch: {
    flex: 1,
  },
});

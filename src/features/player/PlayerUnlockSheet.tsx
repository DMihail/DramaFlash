import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { X } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EPISODE_COST } from '@/domain/wallet';
import { unlockSpendsCoins } from '@/features/player/model';
import { testIds } from '@/testing/testIds';
import { colors, layout, radius, space } from '@/theme/tokens';

const unavailableChoices = [
  { id: 'season', title: 'Full season' },
  { id: 'membership', title: 'Membership' },
] as const;

export function PlayerUnlockSheet({
  balanceLabel,
  busy,
  canAfford,
  confirmLabel,
  detail,
  episode,
  error,
  image,
  onCancel,
  onConfirm,
  onGetCoins,
  title,
}: {
  balanceLabel: string;
  busy: boolean;
  canAfford: boolean;
  confirmLabel: string;
  detail: string;
  episode: number;
  error: string | null;
  image?: ImageSourcePropType;
  onCancel: () => void;
  onConfirm: () => void;
  onGetCoins: () => void;
  title: string;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(351, width - space.lg * 2);

  const handlePrimary = () => {
    if (busy || !unlockSpendsCoins('episode')) {
      return;
    }

    if (canAfford) {
      onConfirm();
      return;
    }

    onGetCoins();
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <Pressable accessibilityLabel="Close unlock" onPress={onCancel} style={styles.backdrop}>
        <Pressable
          accessibilityRole="summary"
          onPress={() => undefined}
          style={[styles.sheet, { width: cardWidth }]}
        >
          <View style={styles.closeRow}>
            <IconButton
              accessibilityLabel="Close unlock"
              icon={X}
              onPress={onCancel}
              testID={testIds.player.unlockCancel}
            />
          </View>
          <View style={styles.heading}>
            {image ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={image}
                style={styles.cover}
              />
            ) : null}
            <View style={styles.headingCopy}>
              <AppText role="titleM">Continue the romance</AppText>
              <AppText role="bodySmall">{title}</AppText>
              <AppText role="caption">{`Episode ${episode}`}</AppText>
            </View>
          </View>
          <View style={[styles.choice, styles.choiceSelected]}>
            <View style={styles.choiceCopy}>
              <AppText role="titleXS">{`Unlock episode ${episode}`}</AppText>
              <AppText role="caption">One episode. You can replay it.</AppText>
            </View>
            <AppText role="titleXS">{`${EPISODE_COST} coins`}</AppText>
          </View>
          {unavailableChoices.map((choice) => (
            <View
              key={choice.id}
              accessibilityState={{ disabled: true }}
              style={[styles.choice, styles.choiceDisabled]}
            >
              <View style={styles.choiceCopy}>
                <AppText color="textMuted" role="titleXS">
                  {choice.title}
                </AppText>
                <AppText role="caption">Not available in this demo</AppText>
              </View>
            </View>
          ))}
          <AppText role="bodySmall" testID={testIds.wallet.balance}>
            {balanceLabel}
          </AppText>
          <AppText role="bodySmall">{detail}</AppText>
          {error ? (
            <AppText accessibilityLiveRegion="polite" color="accent" role="bodySmall">
              {error}
            </AppText>
          ) : null}
          <PrimaryButton
            disabled={busy}
            fill
            label={busy ? 'Saving unlock' : confirmLabel}
            onPress={handlePrimary}
            testID={canAfford ? testIds.player.unlockConfirm : testIds.player.getCoins}
          />
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.later}>
            <AppText role="bodyStrong">Maybe later</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    padding: space.lg,
  },
  sheet: {
    gap: space.md,
    padding: layout.marginDetail,
    borderRadius: radius.sheet,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    maxHeight: '90%',
  },
  closeRow: {
    alignItems: 'flex-end',
  },
  heading: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
  },
  cover: {
    width: 110,
    height: 142,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMedia,
  },
  headingCopy: {
    flex: 1,
    gap: space.xs,
  },
  choice: {
    minHeight: 69,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(100, 237, 247, 0.1)',
  },
  choiceDisabled: {
    opacity: 0.55,
  },
  choiceCopy: {
    flex: 1,
    gap: space.xs,
  },
  later: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

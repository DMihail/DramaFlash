import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Lock, X, Zap } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EPISODE_COST } from '@/domain/wallet';
import { testIds } from '@/testing/testIds';
import { colors, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

export function PlayerUnlockSheet({
  balanceLabel,
  busy,
  canAfford,
  confirmLabel,
  detail,
  episode,
  error,
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
  onCancel: () => void;
  onConfirm: () => void;
  onGetCoins: () => void;
  title: string;
}) {
  const handlePrimary = () => {
    if (busy) {
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
        <Pressable accessibilityRole="summary" onPress={() => undefined} style={styles.sheet}>
          <View style={styles.closeRow}>
            <IconButton
              accessibilityLabel="Close unlock"
              icon={X}
              onPress={onCancel}
              testID={testIds.player.unlockCancel}
            />
          </View>
          <View style={styles.lockBadge}>
            <Lock color={colors.coin} size={iconSize.button} strokeWidth={iconStroke} />
            <AppText role="caption">Locked</AppText>
          </View>
          <AppText role="caption">{`Episode ${episode}`}</AppText>
          <AppText role="titleS">{title}</AppText>
          <AppText role="bodySmall">
            {`Unlock episode ${episode} once. It costs ${EPISODE_COST} coins. You can replay it after that.`}
          </AppText>
          <View style={styles.priceRow}>
            <AppText role="titleXS">{`Unlock episode ${episode}`}</AppText>
            <AppText role="titleXS">{`${EPISODE_COST} coins`}</AppText>
          </View>
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
            icon={canAfford ? Lock : Zap}
            label={busy ? 'Saving unlock' : confirmLabel}
            onPress={handlePrimary}
            testID={canAfford ? testIds.player.unlockConfirm : testIds.player.getCoins}
            variant="player"
          />
          <PrimaryButton label="Maybe later" onPress={onCancel} variant="primary" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    gap: space.md,
    padding: layout.marginDetail,
    paddingBottom: space.section,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.surface,
  },
  closeRow: {
    alignItems: 'flex-end',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
});

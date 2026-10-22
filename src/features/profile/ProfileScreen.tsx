import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { Bookmark, ChevronRight, Settings, User, Zap } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { demoProviderLabel } from '@/domain/session';
import { useAuthSelector } from '@/features/auth/AuthProvider';
import { coinBalanceLabel } from '@/features/coins/model';
import { loginDestination } from '@/features/home/model';
import { useLibrarySelector } from '@/features/library/LibraryProvider';
import { continueItems } from '@/features/library/model';
import {
  profileGuestBody,
  profileReadError,
  profileResetLabel,
  profileResetNote,
  profileResetUnavailable,
  profileSettingsLabel,
  profileSettingsNote,
  profileSignedInBody,
  profileSignOutNote,
  profileTitle,
  profileWelcome,
} from '@/features/profile/model';
import { useOptionalWallet, useWalletSelector } from '@/features/wallet/WalletProvider';
import { testIds } from '@/testing/testIds';
import { colors, control, iconSize, iconStroke, radius, space } from '@/theme/tokens';

export function ProfileScreen({ allowReset = isDevelopmentRuntime() }: { allowReset?: boolean }) {
  const authStatus = useAuthSelector((state) => state.status);
  const provider = useAuthSelector((state) => state.provider);
  const authRetry = useAuthSelector((state) => state.retry);
  const signOut = useAuthSelector((state) => state.signOut);
  const walletStatus = useWalletSelector((state) => state.status);
  const wallet = useWalletSelector((state) => state.wallet);
  const walletRetry = useWalletSelector((state) => state.retry);
  const resetDemo = useWalletSelector((state) => state.resetDemo);
  const libraryStatus = useLibrarySelector((state) => state.status);
  const savedSeriesIds = useLibrarySelector((state) => state.savedSeriesIds);
  const entries = useLibrarySelector((state) => state.entries);
  const optionalWallet = useOptionalWallet();
  const [notice, setNotice] = useState<string | null>(null);
  const signedIn = provider !== null;
  const continueWallet = optionalWallet?.status === 'ready' ? optionalWallet.wallet : null;
  const continueCount =
    libraryStatus === 'ready' && optionalWallet?.status !== 'loading'
      ? continueItems(entries, continueWallet).length
      : 0;

  const handleSignOut = () => {
    void signOut().then((result) => {
      if (result.status === 'saved') {
        setNotice(profileSignOutNote);
      }
    });
  };

  const handleReset = () => {
    if (!allowReset) {
      return;
    }

    void resetDemo().then((result) => {
      if (result === 'reset') {
        setNotice('Demo wallet restored to 15 coins.');
      }
    });
  };

  return (
    <Screen safeArea="tabs" testID={testIds.profile.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText accessibilityRole="header" role="displayL">
          {profileTitle}
        </AppText>
        <View style={styles.avatar}>
          <User color={colors.primary} size={iconSize.button} strokeWidth={iconStroke} />
        </View>
        <AppText role="titleM" style={styles.center}>
          {profileWelcome}
        </AppText>
        <AppText role="bodySmall" style={styles.center}>
          {signedIn ? `Demo account · ${demoProviderLabel(provider)}` : profileGuestBody}
        </AppText>
        {signedIn ? (
          <AppText role="caption" style={styles.center}>
            {profileSignedInBody}
          </AppText>
        ) : null}
        {authStatus === 'error' ? (
          <View style={styles.block}>
            <AppText role="body" testID={testIds.profile.error}>
              {profileReadError}
            </AppText>
            <PrimaryButton
              label="Try again"
              onPress={() => void authRetry()}
              testID={testIds.profile.retry}
            />
          </View>
        ) : null}
        <View style={styles.balance} testID={testIds.profile.balance}>
          <AppText role="caption">Your balance</AppText>
          {walletStatus === 'ready' && wallet ? (
            <View style={styles.balanceValue}>
              <Zap color={colors.coin} size={iconSize.header} strokeWidth={iconStroke} />
              <AppText role="titleM">{coinBalanceLabel(wallet.balance)}</AppText>
            </View>
          ) : walletStatus === 'error' ? (
            <PrimaryButton label="Try again" onPress={() => void walletRetry()} />
          ) : (
            <AppText role="bodySmall">Loading coins</AppText>
          )}
        </View>
        <PrimaryButton
          fill
          icon={Zap}
          label="Get coins"
          onPress={() => router.push('/coins')}
          testID={testIds.profile.coins}
        />
        <ProfileRow
          detail={libraryStatus === 'ready' ? `${savedSeriesIds.length} saved` : 'Library'}
          icon={Bookmark}
          label="My Library"
          onPress={() => router.navigate('/library')}
          testID={testIds.profile.library}
        />
        <ProfileRow
          detail={
            libraryStatus === 'ready' ? `${savedSeriesIds.length} on this device` : 'Saved series'
          }
          label="Saved series"
          onPress={() => router.navigate('/library')}
          testID={testIds.profile.saved}
        />
        <ProfileRow
          detail={continueCount > 0 ? `${continueCount} ready to resume` : 'Nothing to resume yet'}
          label="Continue watching"
          onPress={() => router.navigate('/library')}
          testID={testIds.profile.continue}
        />
        <ProfileRow
          detail={profileSettingsNote}
          disabled
          icon={Settings}
          label={profileSettingsLabel}
          testID={testIds.profile.settings}
        />
        {signedIn ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            style={styles.textButton}
            testID={testIds.profile.signOut}
          >
            <AppText color="primary" role="bodySmall">
              Sign out of demo
            </AppText>
          </Pressable>
        ) : (
          <PrimaryButton
            label="Sign in"
            onPress={() => router.push(loginDestination())}
            testID={testIds.profile.signIn}
          />
        )}
        <PrimaryButton
          disabled={!allowReset}
          label={profileResetLabel}
          onPress={handleReset}
          testID={testIds.profile.reset}
        />
        <AppText role="caption" style={styles.center}>
          {allowReset ? profileResetNote : profileResetUnavailable}
        </AppText>
        {notice ? (
          <AppText
            accessibilityLiveRegion="polite"
            role="bodySmall"
            style={styles.center}
            testID={testIds.profile.notice}
          >
            {notice}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ProfileRow({
  detail,
  disabled = false,
  icon: Icon,
  label,
  onPress,
  testID,
}: {
  detail: string;
  disabled?: boolean;
  icon?: typeof Bookmark;
  label: string;
  onPress?: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, disabled ? styles.disabled : null]}
      testID={testID}
    >
      {Icon ? (
        <Icon color={colors.textSecondary} size={iconSize.header} strokeWidth={iconStroke} />
      ) : null}
      <View style={styles.rowCopy}>
        <AppText role="bodySmall">{label}</AppText>
        <AppText role="caption">{detail}</AppText>
      </View>
      {disabled ? null : (
        <ChevronRight color={colors.textMuted} size={iconSize.header} strokeWidth={iconStroke} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
    alignItems: 'stretch',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  balance: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: space.sm,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  block: {
    gap: space.md,
  },
  row: {
    minHeight: control.button,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowCopy: {
    flex: 1,
    gap: space.xs,
  },
  disabled: {
    opacity: 0.7,
  },
  textButton: {
    minHeight: control.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

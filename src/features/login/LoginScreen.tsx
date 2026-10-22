import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { ChevronLeft, ChevronRight, Mail, ShieldCheck } from 'lucide-react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { LogoMark } from '@/components/LogoMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { type DemoProvider } from '@/domain/auth';
import { validateDemoEmail } from '@/domain/session';
import { useAuthSelector } from '@/features/auth/AuthProvider';
import { useOptionalLibrarySelector } from '@/features/library/LibraryProvider';
import { librarySaveFailedMessage } from '@/features/library/model';
import {
  hrefAfterLogin,
  loginDemoBadge,
  loginDisclaimer,
  loginEmailHint,
  loginPrivacyNotice,
  loginReadError,
  loginSaveError,
  loginSubtitle,
  loginTermsNotice,
  loginTitle,
} from '@/features/login/model';
import { ProviderMark } from '@/features/login/ProviderMark';
import { clearLoginTicket, readLoginTicket } from '@/navigation/pendingLogin';
import { testIds } from '@/testing/testIds';
import { colors, control, iconStroke, radius, space } from '@/theme/tokens';

export function LoginScreen() {
  const status = useAuthSelector((state) => state.status);
  const busy = useAuthSelector((state) => state.busy);
  const retry = useAuthSelector((state) => state.retry);
  const signIn = useAuthSelector((state) => state.signIn);
  const libraryStatus = useOptionalLibrarySelector((state) => state.status);
  const savedSeriesIds = useOptionalLibrarySelector((state) => state.savedSeriesIds);
  const toggleSave = useOptionalLibrarySelector((state) => state.toggleSave);
  const [mode, setMode] = useState<'choices' | 'email'>('choices');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leave = (signedIn: boolean) => {
    const ticket = readLoginTicket();
    clearLoginTicket();
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(hrefAfterLogin(ticket, signedIn));
  };

  const handleGuest = () => {
    leave(false);
  };

  const handleProvider = (provider: Exclude<DemoProvider, 'email'>) => {
    void finishSignIn(provider);
  };

  const handleEmail = () => {
    const checked = validateDemoEmail(email);
    if (!checked.ok) {
      setError(checked.message);
      return;
    }

    setError(null);
    void finishSignIn('email');
  };

  const finishSignIn = async (provider: DemoProvider) => {
    setNotice(null);
    const result = await signIn(provider);
    if (result.status === 'busy' || result.status === 'not-ready') {
      return;
    }

    if (result.status === 'save-failed') {
      setError(loginSaveError);
      return;
    }

    const ticket = readLoginTicket();
    const seriesId = ticket?.seriesIdToSave;
    if (
      seriesId &&
      toggleSave &&
      libraryStatus === 'ready' &&
      !savedSeriesIds?.includes(seriesId)
    ) {
      const saved = await toggleSave(seriesId);
      if (saved.status !== 'saved') {
        setError(librarySaveFailedMessage);
        return;
      }
    }

    leave(true);
  };

  return (
    <Screen safeArea="stack" testID={testIds.login.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.back}>
            <IconButton
              accessibilityLabel="Back to browsing"
              icon={ChevronLeft}
              onPress={handleGuest}
              testID={testIds.login.back}
            />
          </View>
          <View style={styles.brand}>
            <LogoMark />
            <AppText color="primary" role="titleL">
              DramaFlash
            </AppText>
          </View>
          <View style={styles.intro}>
            <AppText accessibilityRole="header" role="displayL" style={styles.heading}>
              {loginTitle}
            </AppText>
            <AppText role="bodySmall" style={styles.subtitle}>
              {loginSubtitle}
            </AppText>
          </View>
          <View style={styles.card}>
            {status === 'error' ? (
              <View style={styles.block}>
                <AppText role="body" testID={testIds.login.error}>
                  {loginReadError}
                </AppText>
                <PrimaryButton label="Try again" onPress={() => void retry()} />
              </View>
            ) : mode === 'email' ? (
              <View style={styles.block}>
                <AppText role="titleS">Continue with Email</AppText>
                <AppText role="caption" style={styles.hint}>
                  {loginEmailHint}
                </AppText>
                <TextInput
                  accessibilityLabel="Demo email"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect={false}
                  inputMode="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  testID={testIds.login.emailInput}
                  value={email}
                />
                {error ? (
                  <AppText
                    accessibilityLiveRegion="polite"
                    role="caption"
                    testID={testIds.login.error}
                  >
                    {error}
                  </AppText>
                ) : null}
                <PrimaryButton
                  disabled={busy}
                  fill
                  label={busy ? 'Signing in…' : 'Continue with Email'}
                  onPress={handleEmail}
                  testID={testIds.login.submit}
                />
                <Pressable accessibilityRole="button" onPress={() => setMode('choices')}>
                  <AppText color="textSecondary" role="caption">
                    Other demo options
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.block}>
                <ProviderButton
                  disabled={busy}
                  label={busy ? 'Signing in…' : 'Continue with Google'}
                  onPress={() => handleProvider('google')}
                  provider="google"
                  testID={testIds.login.google}
                />
                <ProviderButton
                  disabled={busy}
                  label={busy ? 'Signing in…' : 'Continue with Apple'}
                  onPress={() => handleProvider('apple')}
                  provider="apple"
                  testID={testIds.login.apple}
                />
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <AppText role="caption">OR</AppText>
                  <View style={styles.line} />
                </View>
                <PrimaryButton
                  disabled={busy}
                  fill
                  icon={Mail}
                  label={busy ? 'Signing in…' : 'Continue with Email'}
                  onPress={() => {
                    setError(null);
                    setMode('email');
                  }}
                  testID={testIds.login.email}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={handleGuest}
                  style={styles.guest}
                  testID={testIds.login.guest}
                >
                  <AppText color="textSecondary" role="caption">
                    Continue as Guest
                  </AppText>
                </Pressable>
                {error ? (
                  <AppText
                    accessibilityLiveRegion="polite"
                    role="caption"
                    testID={testIds.login.error}
                  >
                    {error}
                  </AppText>
                ) : null}
              </View>
            )}
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setError(null);
                  setMode('email');
                }}
                style={styles.create}
                testID={testIds.login.create}
              >
                <AppText role="bodySmall">New here?</AppText>
                <AppText color="primary" role="bodySmall">
                  Create account
                </AppText>
                <ChevronRight color={colors.primary} size={14} strokeWidth={iconStroke} />
              </Pressable>
              <View style={styles.legal}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setNotice(loginTermsNotice)}
                  testID={testIds.login.terms}
                >
                  <AppText color="textMuted" role="micro">
                    Terms
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setNotice(loginPrivacyNotice)}
                  testID={testIds.login.privacy}
                >
                  <AppText color="textMuted" role="micro">
                    Privacy
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
          <View style={styles.badge}>
            <ShieldCheck color={colors.textSecondary} size={16} strokeWidth={iconStroke} />
            <AppText color="textSecondary" role="micro">
              {loginDemoBadge}
            </AppText>
          </View>
          <AppText role="micro" style={styles.disclaimer}>
            {loginDisclaimer}
          </AppText>
          {notice ? (
            <AppText
              accessibilityLiveRegion="polite"
              role="caption"
              style={styles.notice}
              testID={testIds.login.notice}
            >
              {notice}
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ProviderButton({
  disabled = false,
  label,
  onPress,
  provider,
  testID,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  provider: 'google' | 'apple';
  testID: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.provider}
      testID={testID}
    >
      <ProviderMark provider={provider} />
      <AppText role="bodySmall">{label}</AppText>
      <View style={styles.markSpacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  back: {
    alignSelf: 'flex-start',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  intro: {
    marginTop: space.section,
    alignItems: 'center',
    gap: space.sm,
  },
  heading: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  card: {
    marginTop: space.xxxl,
    width: '100%',
    borderRadius: radius.card,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  block: {
    padding: space.xxl,
    gap: space.md,
  },
  provider: {
    minHeight: control.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  markSpacer: {
    width: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  guest: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: colors.textSecondary,
  },
  input: {
    minHeight: control.button,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  create: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  legal: {
    flexDirection: 'row',
    gap: space.lg,
  },
  badge: {
    marginTop: space.xxl,
    minHeight: 34,
    paddingHorizontal: space.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  disclaimer: {
    marginTop: space.sm,
    textAlign: 'center',
    maxWidth: 300,
    color: colors.textMuted,
  },
  notice: {
    marginTop: space.lg,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});

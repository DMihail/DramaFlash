import { type ReactElement } from 'react';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { serializeSavedSeries } from '@/domain/library';
import { serializeSession } from '@/domain/session';
import { freshWallet, serializeWallet } from '@/domain/wallet';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { coinBalanceLabel } from '@/features/coins/model';
import { loginDestination } from '@/features/home/model';
import { LibraryProvider } from '@/features/library/LibraryProvider';
import { profileResetFailed, profileSignOutFailed } from '@/features/profile/model';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { WalletProvider } from '@/features/wallet/WalletProvider';
import { MMKV_LIBRARY_KEY, MMKV_SESSION_KEY, MMKV_WALLET_KEY } from '@/storage/persistence';
import { testIds } from '@/testing/testIds';

import { memoryLocal } from '../../support/storage';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockRouter.back(...args),
    canGoBack: () => mockRouter.canGoBack(),
    navigate: (...args: unknown[]) => mockRouter.navigate(...args),
    push: (...args: unknown[]) => mockRouter.push(...args),
    replace: (...args: unknown[]) => mockRouter.replace(...args),
  },
}));

jest.mock('lucide-react-native', () => {
  const Icon = () => null;
  return new Proxy({}, { get: () => Icon });
});

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function mount(ui: ReactElement) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>,
    );
    for (let step = 0; step < 12; step += 1) {
      await Promise.resolve();
    }
  });

  if (!renderer) {
    throw new Error('expected a screen');
  }

  return renderer;
}

function press(renderer: TestRenderer.ReactTestRenderer, testID: string) {
  const matches = renderer.root.findAll((node) => node.props.testID === testID);
  const node =
    matches.find((candidate) => typeof candidate.props.onPress === 'function') ?? matches[0];
  if (!node || typeof node.props.onPress !== 'function') {
    throw new Error(`No press handler for ${testID}`);
  }

  (node.props.onPress as () => void)();
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

describe('profile screen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.navigate.mockClear();
  });

  test('a fresh guest sees sign-in actions, not the account dashboard', async () => {
    const local = memoryLocal();
    const renderer = await mount(
      <WalletProvider local={local}>
        <LibraryProvider local={local}>
          <AuthProvider local={local}>
            <ProfileScreen allowReset={false} />
          </AuthProvider>
        </LibraryProvider>
      </WalletProvider>,
    );

    const ids = renderer.root.findAll((node) => typeof node.props.testID === 'string');
    const has = (testID: string) => ids.some((node) => node.props.testID === testID);
    expect(has(testIds.profile.guest)).toBe(true);
    expect(has(testIds.profile.signIn)).toBe(true);
    expect(has(testIds.profile.createAccount)).toBe(true);
    expect(has(testIds.profile.balance)).toBe(false);
    expect(has(testIds.profile.library)).toBe(false);
    expect(has(testIds.profile.signOut)).toBe(false);
    expect(has(testIds.profile.reset)).toBe(false);
    // Opening Profile must not create a session or a wallet record.
    expect(local.snapshot(MMKV_SESSION_KEY)).toBeNull();

    await act(async () => {
      press(renderer, testIds.profile.signIn);
    });
    expect(mockRouter.push).toHaveBeenLastCalledWith(loginDestination());

    await act(async () => {
      press(renderer, testIds.profile.createAccount);
    });
    expect(mockRouter.push).toHaveBeenLastCalledWith(loginDestination());
  });

  test('shows a placeholder, not the guest view, while the session loads', async () => {
    const local = memoryLocal({ [MMKV_SESSION_KEY]: serializeSession({ provider: 'google' }) });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    // Synchronous act: effects run, but the async session read has not finished.
    act(() => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <WalletProvider local={local}>
            <LibraryProvider local={local}>
              <AuthProvider local={local}>
                <ProfileScreen allowReset={false} />
              </AuthProvider>
            </LibraryProvider>
          </WalletProvider>
        </SafeAreaProvider>,
      );
    });
    if (!renderer) {
      throw new Error('expected a screen');
    }
    const screen = renderer;
    const has = (testID: string) =>
      screen.root.findAll((node) => node.props.testID === testID).length > 0;

    expect(has(testIds.profile.loading)).toBe(true);
    expect(has(testIds.profile.guest)).toBe(false);

    await act(async () => {
      for (let step = 0; step < 12; step += 1) {
        await Promise.resolve();
      }
    });

    // The stored session restores straight to the signed-in profile.
    expect(has(testIds.profile.loading)).toBe(false);
    expect(has(testIds.profile.guest)).toBe(false);
    expect(textOf(screen)).toContain('Demo account · Google');

    await act(async () => {
      screen.unmount();
    });
  });

  test('restores a saved session and shows the wallet balance and library', async () => {
    const wallet = serializeWallet(freshWallet());
    const local = memoryLocal({
      [MMKV_WALLET_KEY]: wallet,
      [MMKV_LIBRARY_KEY]: serializeSavedSeries(['the-ceo-and-i']),
      [MMKV_SESSION_KEY]: serializeSession({ provider: 'email' }),
    });
    const renderer = await mount(
      <WalletProvider local={local}>
        <LibraryProvider local={local}>
          <AuthProvider local={local}>
            <ProfileScreen allowReset={false} />
          </AuthProvider>
        </LibraryProvider>
      </WalletProvider>,
    );

    expect(textOf(renderer)).toContain('Demo account · Email');
    expect(textOf(renderer)).toContain(coinBalanceLabel(15));
    expect(textOf(renderer)).toContain('Coming soon');

    await act(async () => {
      press(renderer, testIds.profile.library);
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith('/library');
    const settings = renderer.root
      .findAll((node) => node.props.testID === testIds.profile.settings)
      .find((node) => node.props.accessibilityState);
    expect(settings?.props.accessibilityState).toEqual({ disabled: true });
  });

  test('signs out without deleting coins or saved series', async () => {
    const wallet = serializeWallet(freshWallet());
    const library = serializeSavedSeries(['shadow-kiss']);
    const local = memoryLocal({
      [MMKV_WALLET_KEY]: wallet,
      [MMKV_LIBRARY_KEY]: library,
      [MMKV_SESSION_KEY]: serializeSession({ provider: 'apple' }),
    });
    const renderer = await mount(
      <WalletProvider local={local}>
        <LibraryProvider local={local}>
          <AuthProvider local={local}>
            <ProfileScreen allowReset={false} />
          </AuthProvider>
        </LibraryProvider>
      </WalletProvider>,
    );

    expect(textOf(renderer)).toContain('Demo account · Apple');

    await act(async () => {
      press(renderer, testIds.profile.signOut);
      for (let step = 0; step < 8; step += 1) {
        await Promise.resolve();
      }
    });

    expect(textOf(renderer)).toContain('Your coins and library stay on this device.');
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(wallet);
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toBe(library);
    expect(local.snapshot(MMKV_SESSION_KEY)).toContain('"provider":null');
  });

  test('keeps the demo session when sign-out cannot be saved', async () => {
    const session = serializeSession({ provider: 'apple' });
    const local = memoryLocal({
      [MMKV_WALLET_KEY]: serializeWallet(freshWallet()),
      [MMKV_SESSION_KEY]: session,
    });
    local.setString = () => {
      throw new Error('disk full');
    };
    const renderer = await mount(
      <WalletProvider local={local}>
        <LibraryProvider local={local}>
          <AuthProvider local={local}>
            <ProfileScreen allowReset={false} />
          </AuthProvider>
        </LibraryProvider>
      </WalletProvider>,
    );

    await act(async () => {
      press(renderer, testIds.profile.signOut);
      for (let step = 0; step < 8; step += 1) {
        await Promise.resolve();
      }
    });

    expect(textOf(renderer)).toContain(profileSignOutFailed);
    expect(local.snapshot(MMKV_SESSION_KEY)).toBe(session);
  });

  test('shows an error when the demo wallet reset cannot be saved', async () => {
    const wallet = serializeWallet(freshWallet());
    const local = memoryLocal({ [MMKV_WALLET_KEY]: wallet });
    local.delete = () => {
      throw new Error('disk full');
    };
    const renderer = await mount(
      <WalletProvider allowReset local={local}>
        <LibraryProvider local={local}>
          <AuthProvider local={local}>
            <ProfileScreen allowReset />
          </AuthProvider>
        </LibraryProvider>
      </WalletProvider>,
    );

    await act(async () => {
      press(renderer, testIds.profile.reset);
      for (let step = 0; step < 8; step += 1) {
        await Promise.resolve();
      }
    });

    expect(textOf(renderer)).toContain(profileResetFailed);
    expect(local.snapshot(MMKV_WALLET_KEY)).toBe(wallet);
  });
});

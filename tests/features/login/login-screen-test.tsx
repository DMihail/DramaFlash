import { type ReactElement } from 'react';

import { type Metrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TestRenderer, { act } from 'react-test-renderer';

import { createLoginTicket } from '@/domain/auth';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { LibraryProvider } from '@/features/library/LibraryProvider';
import { LoginScreen } from '@/features/login/LoginScreen';
import { hrefAfterLogin } from '@/features/login/model';
import { clearLoginTicket, holdLoginTicket } from '@/navigation/pendingLogin';
import { MMKV_LIBRARY_KEY, MMKV_SESSION_KEY } from '@/storage/persistence';
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
  const node = renderer.root.findAll((candidate) => candidate.props.testID === testID)[0];
  if (!node) {
    throw new Error(`Missing ${testID}`);
  }

  const onPress = node.props.onPress as (() => void) | undefined;
  if (!onPress) {
    throw new Error(`No press handler for ${testID}`);
  }

  onPress();
}

function textOf(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAll((node) => typeof node.props.children === 'string')
    .map((node) => (typeof node.props.children === 'string' ? node.props.children : ''))
    .join('\n');
}

describe('login screen', () => {
  beforeEach(() => {
    clearLoginTicket();
    mockRouter.back.mockClear();
    mockRouter.replace.mockClear();
    mockRouter.canGoBack.mockReturnValue(true);
  });

  test('returns a guest to the previous screen', async () => {
    const renderer = await mount(
      <AuthProvider local={memoryLocal()}>
        <LoginScreen />
      </AuthProvider>,
    );

    await act(async () => {
      press(renderer, testIds.login.guest);
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(textOf(renderer)).toContain('Demo sign-in · No credentials');
  });

  test('rejects an invalid demo email and does not save it', async () => {
    const local = memoryLocal();
    const renderer = await mount(
      <AuthProvider local={local}>
        <LoginScreen />
      </AuthProvider>,
    );

    await act(async () => {
      press(renderer, testIds.login.email);
    });
    const input = renderer.root.findByProps({ testID: testIds.login.emailInput });
    await act(async () => {
      (input.props.onChangeText as (value: string) => void)('not-an-email');
    });
    await act(async () => {
      press(renderer, testIds.login.submit);
    });

    expect(textOf(renderer)).toContain('Enter a valid email address.');
    expect(local.snapshot(MMKV_SESSION_KEY)).toBeNull();
  });

  test('signs in with a demo provider and saves a pending series', async () => {
    const local = memoryLocal();
    holdLoginTicket(
      createLoginTicket({
        currentScreen: 'series',
        destination: 'series',
        wasPlaying: false,
        seriesIdToSave: 'love-on-detours',
      }),
    );
    mockRouter.canGoBack.mockReturnValue(false);
    const renderer = await mount(
      <LibraryProvider local={local}>
        <AuthProvider local={local}>
          <LoginScreen />
        </AuthProvider>
      </LibraryProvider>,
    );

    await act(async () => {
      press(renderer, testIds.login.google);
      for (let step = 0; step < 12; step += 1) {
        await Promise.resolve();
      }
    });

    expect(local.snapshot(MMKV_SESSION_KEY)).toContain('google');
    expect(local.snapshot(MMKV_SESSION_KEY)).not.toContain('@');
    expect(local.snapshot(MMKV_LIBRARY_KEY)).toContain('love-on-detours');
    expect(mockRouter.replace).toHaveBeenCalledWith(
      hrefAfterLogin(
        createLoginTicket({
          currentScreen: 'series',
          destination: 'series',
          wasPlaying: false,
          seriesIdToSave: 'love-on-detours',
        }),
        true,
      ),
    );
  });
});

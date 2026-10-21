import type { ExpoConfig } from 'expo/config';

import { APPLICATION_IDS, applyAppVariant, resolveAppVariant } from '@/config/app-variant';
import appJson from '../../../app.json';

const EAS_PROJECT_ID = '33a80453-d173-4c89-a709-54dd349a68b2';

const baseConfig = {
  name: 'drama-flash',
  slug: 'drama-flash',
  scheme: 'dramaflash',
  ios: { buildNumber: '1' },
  android: { versionCode: 1 },
  plugins: ['expo-router'],
} as ExpoConfig;

describe('app variants', () => {
  test('defaults an unset variant to production identifiers', () => {
    expect(resolveAppVariant(undefined)).toBe('production');

    const config = applyAppVariant(baseConfig, 'production');

    expect(config.name).toBe('drama-flash');
    expect(config.scheme).toBe('dramaflash');
    expect(config.ios?.bundleIdentifier).toBe(APPLICATION_IDS.production);
    expect(config.android?.package).toBe(APPLICATION_IDS.production);
  });

  test('gives the development variant its own name, scheme, and application id', () => {
    const config = applyAppVariant(baseConfig, resolveAppVariant('development'));

    expect(config.name).toBe('drama-flash (Dev)');
    expect(config.scheme).toBe('dramaflash-dev');
    expect(config.ios?.bundleIdentifier).toBe('com.dramaflash.app.dev');
    expect(config.android?.package).toBe('com.dramaflash.app.dev');
  });

  test('keeps production and development installs side by side', () => {
    const production = applyAppVariant(baseConfig, 'production');
    const development = applyAppVariant(baseConfig, 'development');

    expect(development.ios?.bundleIdentifier).not.toBe(production.ios?.bundleIdentifier);
    expect(development.android?.package).not.toBe(production.android?.package);
    expect(development.scheme).not.toBe(production.scheme);
  });

  test('registers the dev-client scheme only on the development variant', () => {
    const production = applyAppVariant(baseConfig, 'production');
    const development = applyAppVariant(baseConfig, 'development');

    expect(production.plugins).toContainEqual(['expo-dev-client', { addGeneratedScheme: false }]);
    expect(development.plugins).toContainEqual(['expo-dev-client', { addGeneratedScheme: true }]);
    expect(production.plugins).toContain('expo-router');
  });

  test('rejects an unknown variant instead of silently shipping production ids', () => {
    expect(() => resolveAppVariant('staging')).toThrow('Unsupported APP_VARIANT "staging"');
  });

  test('keeps the EAS project id and owner on both variants', () => {
    expect(appJson.expo.owner).toBe('dmihail');
    expect(appJson.expo.extra.eas.projectId).toBe(EAS_PROJECT_ID);
    expect(appJson.expo.ios.bundleIdentifier).toBe(APPLICATION_IDS.production);
    expect(appJson.expo.android.package).toBe(APPLICATION_IDS.production);

    const linked = {
      ...baseConfig,
      owner: appJson.expo.owner,
      extra: appJson.expo.extra,
    } as ExpoConfig;

    for (const variant of ['development', 'production'] as const) {
      const config = applyAppVariant(linked, variant);

      expect(config.owner).toBe('dmihail');
      expect(config.extra?.eas).toEqual({ projectId: EAS_PROJECT_ID });
      expect(config.ios?.bundleIdentifier).toBe(APPLICATION_IDS[variant]);
      expect(config.android?.package).toBe(APPLICATION_IDS[variant]);
    }
  });
});

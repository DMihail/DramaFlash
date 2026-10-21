import type { ExpoConfig } from 'expo/config';

export const APP_VARIANTS = ['development', 'production'] as const;

export type AppVariant = (typeof APP_VARIANTS)[number];

export const APPLICATION_IDS: Record<AppVariant, string> = {
  development: 'com.dramaflash.app.dev',
  production: 'com.dramaflash.app',
};

const DEVELOPMENT_SCHEME = 'dramaflash-dev';

export function resolveAppVariant(value: string | undefined): AppVariant {
  if (value === undefined || value === '' || value === 'production') {
    return 'production';
  }

  if (value === 'development') {
    return 'development';
  }

  throw new Error(`Unsupported APP_VARIANT "${value}". Expected "development" or "production".`);
}

export function applyAppVariant(config: Partial<ExpoConfig>, variant: AppVariant): ExpoConfig {
  const name = config.name ?? 'drama-flash';
  const isDevelopment = variant === 'development';

  return {
    ...config,
    name: isDevelopment ? `${name} (Dev)` : name,
    slug: config.slug ?? 'drama-flash',
    scheme: isDevelopment ? DEVELOPMENT_SCHEME : (config.scheme ?? 'dramaflash'),
    ios: {
      ...config.ios,
      bundleIdentifier: APPLICATION_IDS[variant],
    },
    android: {
      ...config.android,
      package: APPLICATION_IDS[variant],
    },
    plugins: [...(config.plugins ?? []), ['expo-dev-client', { addGeneratedScheme: isDevelopment }]],
  };
}

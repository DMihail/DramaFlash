import Constants from 'expo-constants';

export function isDevelopmentRuntime(): boolean {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object') {
    return false;
  }

  return 'appVariant' in extra && extra.appVariant === 'development';
}

import Constants from 'expo-constants';

/**
 * True only for the development app variant.
 *
 * Reset routes call this before they render. Production, a missing config, and
 * an unknown extra value all return false, and those routes redirect home.
 */
export function isDevelopmentRuntime(): boolean {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object') {
    return false;
  }

  return 'appVariant' in extra && extra.appVariant === 'development';
}

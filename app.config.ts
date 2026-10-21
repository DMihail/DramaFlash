// Keep this before the app-variant import. Expo transpiles this file to
// CommonJS, and tsx has to register before that TypeScript module loads.
import 'tsx/cjs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

import { applyAppVariant, resolveAppVariant } from '@/config/app-variant';

export default ({ config }: ConfigContext): ExpoConfig =>
  applyAppVariant(config, resolveAppVariant(process.env.APP_VARIANT));

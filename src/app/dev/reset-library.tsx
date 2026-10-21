import { Redirect } from 'expo-router';

import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { ResetLibraryScreen } from '@/features/library/ResetLibraryScreen';

export default function ResetLibraryRoute() {
  if (!isDevelopmentRuntime()) {
    return <Redirect href="/" />;
  }

  return <ResetLibraryScreen />;
}

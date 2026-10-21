import { Redirect } from 'expo-router';

import { isDevelopmentRuntime } from '@/config/runtimeVariant';
import { ResetWalletScreen } from '@/features/wallet/ResetWalletScreen';

export default function ResetWalletRoute() {
  if (!isDevelopmentRuntime()) {
    return <Redirect href="/" />;
  }

  return <ResetWalletScreen />;
}

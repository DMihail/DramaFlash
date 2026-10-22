import { createMMKV } from 'react-native-mmkv';

import {
  type LocalStorage,
  MMKV_RECOVERY_STRATEGY,
  STORAGE_NAMESPACE,
} from '@/storage/persistence';

/**
 * Native MMKV adapter. The web bundle uses `appStorage.web.ts` and does not
 * import this module.
 *
 * `recover-on-error` keeps a damaged file readable. It does not delete the
 * wallet and replace it with 15 coins.
 */
export function createMmkvStorage(): LocalStorage {
  const storage = createMMKV({
    id: STORAGE_NAMESPACE,
    recoveryStrategy: MMKV_RECOVERY_STRATEGY,
  });

  return {
    getString: (key) => storage.getString(key),
    setString: (key, value) => {
      storage.set(key, value);
    },
    delete: (key) => {
      storage.remove(key);
    },
  };
}

import { createMMKV } from 'react-native-mmkv';

import {
  type LocalStorage,
  MMKV_RECOVERY_STRATEGY,
  STORAGE_NAMESPACE,
} from '@/storage/persistence';

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

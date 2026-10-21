import { createMMKV } from 'react-native-mmkv';

import { type LocalStorage, STORAGE_NAMESPACE } from '@/storage/persistence';

export function createMmkvStorage(): LocalStorage {
  const storage = createMMKV({
    id: STORAGE_NAMESPACE,
    recoveryStrategy: 'recover-on-error',
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

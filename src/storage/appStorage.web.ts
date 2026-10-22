import { createWebStorage } from '@/storage/webStorage';

/** Web entry. Metro loads this file instead of `appStorage.ts`, so MMKV stays out of the web bundle. */
export function createAppStorage() {
  return createWebStorage();
}

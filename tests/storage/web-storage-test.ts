import { freshWallet, serializeWallet } from '@/domain/wallet';
import { createWebStorage, type WebStorageBackend } from '@/storage/webStorage';
import { MMKV_SESSION_KEY, MMKV_WALLET_KEY } from '@/storage/persistence';

function memoryBackend(): WebStorageBackend & { snapshot: () => Record<string, string> } {
  const data = new Map<string, string>();

  return {
    snapshot: () => Object.fromEntries(data),
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('web storage', () => {
  test('keeps wallet data when a second store reads the same browser storage', async () => {
    const backend = memoryBackend();
    const first = createWebStorage(backend);
    const wallet = serializeWallet(freshWallet());

    await first.setString(MMKV_WALLET_KEY, wallet);
    await first.setString(MMKV_SESSION_KEY, '{"schema":1,"provider":"google"}');

    const reloaded = createWebStorage(backend);

    expect(await reloaded.getString(MMKV_WALLET_KEY)).toBe(wallet);
    expect(await reloaded.getString(MMKV_SESSION_KEY)).toContain('google');
    expect(backend.snapshot()[`dramaflash.${MMKV_WALLET_KEY}`]).toBe(wallet);
  });

  test('does not pretend missing browser storage is an empty wallet', async () => {
    const storage = createWebStorage(null);

    expect(() => storage.getString(MMKV_WALLET_KEY)).toThrow('Browser storage is not available');
  });
});

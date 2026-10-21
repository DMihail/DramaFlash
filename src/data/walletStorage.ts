import AsyncStorage from '@react-native-async-storage/async-storage';

import { type WalletStorage } from '@/domain/wallet';

export const asyncWalletStorage: WalletStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

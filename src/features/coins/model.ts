import { type coinPacks, EPISODE_COST } from '@/domain/wallet';

export const demoPurchaseNote = 'All coin packages are simulated. No real money is charged.';
export const demoPurchaseSuccess = 'Demo coins added. No money was charged.';
export const demoPurchaseFailed = 'The demo coins could not be saved. Your balance did not change.';
export const walletReadErrorMessage = 'Saved coins could not be read. Your balance was not reset.';
export const unlockSaveFailedMessage = 'The unlock could not be saved. No coins were charged.';
export const unlockRejectedMessage = 'This episode cannot be unlocked.';
export const unlockSavedMessage = 'Episode unlocked. You can watch it now.';

export function coinBalanceLabel(balance: number): string {
  return `${balance} coins`;
}

export function unlockConfirmDetail(balance: number): string {
  return `Confirm to spend ${EPISODE_COST} coins. Your balance will be ${balance - EPISODE_COST} coins.`;
}

export function insufficientCoinsDetail(balance: number): string {
  const needed = EPISODE_COST - balance;
  const noun = needed === 1 ? 'coin' : 'coins';
  return `You need ${needed} more ${noun}. Add demo coins, then come back to confirm.`;
}

export function coinPackTitle(pack: (typeof coinPacks)[number]): string {
  if (pack.bonus > 0) {
    return `${pack.coins} + ${pack.bonus} bonus`;
  }

  return `${pack.coins} coins`;
}

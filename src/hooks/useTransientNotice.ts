import { useEffect } from 'react';

const noticeDurationMs = 2600;

/**
 * Clears a short status message after it has been on screen.
 *
 * Pass the `useState` setter. A new message restarts the timer. `null` leaves
 * the timer stopped.
 */
export function useTransientNotice(
  notice: string | null,
  setNotice: (message: string | null) => void,
): void {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = setTimeout(() => setNotice(null), noticeDurationMs);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);
}

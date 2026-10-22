import { type LoginTicket } from '@/domain/auth';

/**
 * In-memory return ticket for demo login.
 *
 * It is not written to storage. A refresh drops it. Holding a ticket does not
 * sign the user in and does not change the wallet or the library.
 */
let pendingLoginTicket: LoginTicket | null = null;

export function holdLoginTicket(ticket: LoginTicket): void {
  pendingLoginTicket = ticket;
}

export function readLoginTicket(): LoginTicket | null {
  return pendingLoginTicket;
}

export function clearLoginTicket(): void {
  pendingLoginTicket = null;
}

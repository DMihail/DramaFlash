import { type LoginTicket } from '@/domain/auth';

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

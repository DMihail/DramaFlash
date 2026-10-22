import { type Href } from 'expo-router';

import { cancelLogin, type LoginTicket, signedInScreen } from '@/domain/auth';

export const loginTitle = 'Your next obsession starts here.';
export const loginSubtitle = 'Dive into premium short-form romances.';
export const loginDemoBadge = 'Demo sign-in · No credentials';
export const loginDisclaimer =
  'Simulated authentication. No Google, Apple, or email account is accessed.';
export const loginTermsNotice =
  'Demo terms: sign-in is simulated. No real account, subscription, or payment is created.';
export const loginPrivacyNotice =
  'Demo privacy: no credentials are collected. Only the demo sign-in choice is stored on this device.';
export const loginSaveError = 'Demo sign-in could not be saved on this device.';
export const loginEmailHint = 'This email is checked and then discarded. It is not saved.';

export function hrefAfterLogin(ticket: LoginTicket | null, signedIn: boolean): Href {
  if (!ticket) {
    return signedIn ? '/profile' : '/';
  }

  const screen = signedIn ? signedInScreen(ticket) : cancelLogin(ticket).screen;

  switch (screen) {
    case 'discover':
      return '/discover';
    case 'library':
      return '/library';
    case 'profile':
      return '/profile';
    case 'series':
      return ticket.seriesIdToSave
        ? { pathname: '/series/[seriesId]', params: { seriesId: ticket.seriesIdToSave } }
        : '/';
    case 'player':
      return ticket.seriesIdToSave
        ? {
            pathname: '/player/[seriesId]',
            params: { seriesId: ticket.seriesIdToSave, episode: '1' },
          }
        : '/';
    default:
      return '/';
  }
}

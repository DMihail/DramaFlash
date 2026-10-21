import { readLoginTicket } from '@/navigation/pendingLogin';
import { Placeholder } from '@/navigation/placeholder';

export default function LoginScreen() {
  const seriesId = readLoginTicket()?.seriesIdToSave;

  if (!seriesId) {
    return <Placeholder safeArea="stack" title="Login" />;
  }

  return <Placeholder detail={seriesId} safeArea="stack" title="Login" />;
}

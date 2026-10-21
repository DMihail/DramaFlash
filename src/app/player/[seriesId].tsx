import { useLocalSearchParams } from 'expo-router';

import { PlayerScreen } from '@/features/player/PlayerScreen';
import { readParam } from '@/navigation/params';

export default function PlayerRoute() {
  const params = useLocalSearchParams<{ seriesId: string; episode?: string }>();

  return (
    <PlayerScreen episodeParam={readParam(params.episode)} seriesId={readParam(params.seriesId)} />
  );
}

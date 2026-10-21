import { useLocalSearchParams } from 'expo-router';

import { CoinStoreScreen } from '@/features/coins/CoinStoreScreen';
import { readParam } from '@/navigation/params';

export default function CoinStoreRoute() {
  const params = useLocalSearchParams<{ episode?: string; seriesId?: string }>();
  const episode = readParam(params.episode);
  const seriesId = readParam(params.seriesId);

  return <CoinStoreScreen {...(episode ? { episode } : {})} {...(seriesId ? { seriesId } : {})} />;
}

import { useLocalSearchParams } from 'expo-router';

import { SeriesDetailsScreen } from '@/features/series/SeriesDetailsScreen';
import { readParam } from '@/navigation/params';

export default function SeriesScreen() {
  const params = useLocalSearchParams<{ seriesId: string }>();
  const seriesId = readParam(params.seriesId);

  return <SeriesDetailsScreen key={seriesId ?? 'missing'} seriesId={seriesId} />;
}

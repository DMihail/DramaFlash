import { useLocalSearchParams } from 'expo-router';

import { findSeries } from '@/data/catalog';
import { readParam } from '@/navigation/params';
import { Placeholder } from '@/navigation/placeholder';

export default function SeriesScreen() {
  const params = useLocalSearchParams<{ seriesId: string }>();
  const seriesId = readParam(params.seriesId);
  const series = seriesId ? findSeries(seriesId) : undefined;

  if (!series) {
    return seriesId ? (
      <Placeholder detail={seriesId} safeArea="stack" title="Series not found" />
    ) : (
      <Placeholder safeArea="stack" title="Series not found" />
    );
  }

  const count =
    series.episodeCount === null
      ? 'Episode count not confirmed'
      : `${series.episodeCount} episodes`;
  return <Placeholder detail={count} safeArea="stack" title={series.title} />;
}

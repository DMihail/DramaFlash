import { useLocalSearchParams } from 'expo-router';

import { findSeries } from '@/data/catalog';
import { parseEpisodeNumber, readParam } from '@/navigation/params';
import { Placeholder } from '@/navigation/placeholder';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ seriesId: string; episode?: string }>();
  const seriesId = readParam(params.seriesId);
  const series = seriesId ? findSeries(seriesId) : undefined;
  const episode = parseEpisodeNumber(params.episode, series?.episodeCount ?? null);

  if (!series) {
    return <Placeholder title="Series not found" detail={seriesId} />;
  }

  return <Placeholder title={series.title} detail={`Episode ${episode}`} />;
}

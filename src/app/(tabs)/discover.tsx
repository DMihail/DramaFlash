import { useLocalSearchParams } from 'expo-router';

import { DiscoverScreen } from '@/features/discover/DiscoverScreen';
import { readParam } from '@/navigation/params';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = readParam(params.category);

  return <DiscoverScreen {...(category ? { category } : {})} />;
}

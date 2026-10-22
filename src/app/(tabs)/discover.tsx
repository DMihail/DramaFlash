import { useLocalSearchParams } from 'expo-router';

import { DiscoverScreen } from '@/features/discover/DiscoverScreen';
import { readParam } from '@/navigation/params';

export default function DiscoverRoute() {
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const category = readParam(params.category);
  const searchRequest = readParam(params.search);

  return (
    <DiscoverScreen
      {...(category ? { category } : {})}
      {...(searchRequest ? { searchRequest } : {})}
    />
  );
}

import { useLocalSearchParams } from 'expo-router';

import { readParam } from '@/navigation/params';
import { Placeholder } from '@/navigation/placeholder';

export default function DiscoverScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = readParam(params.category);

  if (!category) {
    return <Placeholder safeArea="tabs" title="Discover" />;
  }

  return <Placeholder detail={category} safeArea="tabs" title="Discover" />;
}

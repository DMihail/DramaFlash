import { type ComponentRef, useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { Search, X } from 'lucide-react-native';

import { type DiscoverLoader, fetchDiscoverCatalog } from '@/api/discover';
import { AppText } from '@/components/AppText';
import { GenreChip } from '@/components/GenreChip';
import { PosterCard } from '@/components/PosterCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { type Series } from '@/data/catalog';
import {
  discoverEmptyMessage,
  discoverErrorMessage,
  discoverGenre,
  discoverHeading,
  discoverPosterSize,
  discoverSearchPlaceholder,
  discoverTitle,
  filterDiscoverCatalog,
} from '@/features/discover/model';
import {
  type DiscoverCatalogState,
  useDiscoverCatalog,
} from '@/features/discover/useDiscoverCatalog';
import { posterArt } from '@/features/home/assets';
import { episodeMeta, type HomeGenre, homeGenres, seriesDestination } from '@/features/home/model';
import { testIds } from '@/testing/testIds';
import { discoverColumnCount } from '@/theme/responsive';
import { colors, control, iconSize, iconStroke, layout, radius, space } from '@/theme/tokens';

const skeletonSlots = [0, 1, 2, 3] as const;

export function DiscoverScreen({
  category,
  loadCatalog = fetchDiscoverCatalog,
  searchRequest,
}: {
  category?: string;
  loadCatalog?: DiscoverLoader;
  /** Set only by the Home search button. A new value focuses the field once. */
  searchRequest?: string;
}) {
  const { width } = useWindowDimensions();
  const routeGenre = discoverGenre(category);
  const [genre, setGenre] = useState<HomeGenre>(routeGenre);
  const [trackedGenre, setTrackedGenre] = useState(routeGenre);
  const [query, setQuery] = useState('');
  // `TextInput` names the component here, so the instance type comes from ComponentRef.
  const searchInput = useRef<ComponentRef<typeof TextInput>>(null);

  // Leaving the tab must close the keyboard. Tabs stay mounted, so a focused
  // field would otherwise keep the keyboard open over the next screen.
  useFocusEffect(
    useCallback(
      () => () => {
        searchInput.current?.blur();
        Keyboard.dismiss();
      },
      [],
    ),
  );
  const { retry, state } = useDiscoverCatalog(loadCatalog);
  const columns = discoverColumnCount(width);
  const poster = discoverPosterSize(width, columns);

  if (routeGenre !== trackedGenre) {
    setTrackedGenre(routeGenre);
    setGenre(routeGenre);
    setQuery('');
  }

  // Each Home search tap starts a fresh search, even when the genre is already All.
  const [trackedRequest, setTrackedRequest] = useState(searchRequest);
  if (searchRequest !== trackedRequest) {
    setTrackedRequest(searchRequest);
    if (searchRequest !== undefined) {
      setQuery('');
    }
  }

  const handleOpenSeries = (seriesId: string) => {
    router.push(seriesDestination(seriesId));
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleRetry = () => {
    retry();
  };

  return (
    <Screen safeArea="tabs" testID={testIds.discover.screen}>
      <View style={styles.header}>
        <AppText accessibilityRole="header" role="displayL">
          {discoverTitle}
        </AppText>
      </View>
      <View style={styles.searchField}>
        <Search color={colors.textMuted} size={iconSize.header} strokeWidth={iconStroke} />
        {/* Browse mode by default. A new search request mounts the field again so autoFocus runs. */}
        <TextInput
          key={searchRequest ?? 'browse'}
          ref={searchInput}
          accessibilityLabel="Search dramas"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={searchRequest !== undefined}
          onChangeText={setQuery}
          placeholder={discoverSearchPlaceholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
          testID={testIds.discover.search}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClear}
            testID={testIds.discover.clear}
          >
            <X color={colors.textSecondary} size={iconSize.header} strokeWidth={iconStroke} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {homeGenres.map((item) => (
          <GenreChip
            key={item}
            label={item}
            onPress={() => setGenre(item)}
            selected={item === genre}
            testID={testIds.discover.genre(item)}
          />
        ))}
      </ScrollView>
      <DiscoverBody
        columns={columns}
        genre={genre}
        onOpenSeries={handleOpenSeries}
        onRetry={handleRetry}
        poster={poster}
        query={query}
        state={state}
      />
    </Screen>
  );
}

function DiscoverBody({
  columns,
  genre,
  onOpenSeries,
  onRetry,
  poster,
  query,
  state,
}: {
  columns: number;
  genre: HomeGenre;
  onOpenSeries: (seriesId: string) => void;
  onRetry: () => void;
  poster: { width: number; height: number };
  query: string;
  state: DiscoverCatalogState;
}) {
  if (state.status === 'loading') {
    return (
      <View
        accessibilityLabel="Loading dramas"
        accessibilityState={{ busy: true }}
        style={styles.skeletonGrid}
        testID={testIds.discover.loading}
      >
        {skeletonSlots.map((slot) => (
          <Skeleton height={poster.height} key={slot} radius={radius.lg} width={poster.width} />
        ))}
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.status}>
        <AppText role="body">{discoverErrorMessage}</AppText>
        <PrimaryButton label="Try again" onPress={onRetry} testID={testIds.discover.retry} />
      </View>
    );
  }

  const results = filterDiscoverCatalog(state.series, genre, query);

  return (
    <FlatList
      key={columns}
      contentContainerStyle={styles.list}
      data={results}
      style={styles.results}
      initialNumToRender={12}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      {...(results.length > 0 ? { columnWrapperStyle: styles.row } : {})}
      ListEmptyComponent={
        <AppText role="body" style={styles.empty} testID={testIds.discover.empty}>
          {discoverEmptyMessage(query)}
        </AppText>
      }
      ListHeaderComponent={
        <AppText role="titleM" style={styles.heading}>
          {discoverHeading(query)}
        </AppText>
      }
      numColumns={columns}
      renderItem={({ item }) => (
        <DiscoverPoster item={item} onOpenSeries={onOpenSeries} poster={poster} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function DiscoverPoster({
  item,
  onOpenSeries,
  poster,
}: {
  item: Series;
  onOpenSeries: (seriesId: string) => void;
  poster: { width: number; height: number };
}) {
  const image = posterArt(item.id);
  const meta = episodeMeta(item.episodeCount);

  return (
    <PosterCard
      onPress={() => onOpenSeries(item.id)}
      size={poster}
      testID={testIds.discover.poster(item.id)}
      title={item.title}
      variant="grid"
      {...(image ? { image } : {})}
      {...(meta ? { meta } : {})}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.marginScreen,
    paddingBottom: space.md,
  },
  searchField: {
    minHeight: control.button,
    marginHorizontal: layout.marginScreen,
    marginBottom: space.lg,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: control.button,
    color: colors.text,
    fontSize: 16,
    paddingVertical: space.sm,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: space.lg,
  },
  chips: {
    paddingHorizontal: layout.marginScreen,
    gap: space.sm,
    alignItems: 'center',
  },
  results: {
    flex: 1,
  },
  list: {
    paddingBottom: space.xxxl,
    flexGrow: 1,
  },
  heading: {
    paddingHorizontal: layout.marginScreen,
    paddingBottom: space.lg,
  },
  row: {
    paddingHorizontal: layout.marginScreen,
    gap: space.md,
    marginBottom: space.lg,
    alignItems: 'flex-start',
  },
  empty: {
    paddingHorizontal: layout.marginScreen,
    color: colors.textSecondary,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingHorizontal: layout.marginScreen,
  },
  status: {
    paddingHorizontal: layout.marginScreen,
    gap: space.lg,
    alignItems: 'flex-start',
  },
});

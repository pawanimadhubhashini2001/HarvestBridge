import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Text,
} from 'react-native-paper';

import {
  getStoryFeed,
  getStoryFeedQueryKey,
  recordStoryView,
  type StoryFeedQueryParams,
  type StoryFeedSort,
  type StoryFeedStoryDto,
} from '@/api/story-feed.api';
import { ErrorState } from '@/components/common/error-state';
import { StoryViewerMedia } from '@/components/stories/StoryViewerMedia';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function formatDistance(distance?: number | null) {
  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return 'Distance unavailable';
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km away`;
}

function formatViewCount(viewCount?: number | null) {
  if (typeof viewCount !== 'number' || !Number.isFinite(viewCount)) {
    return '0 views';
  }

  return `${viewCount} ${viewCount === 1 ? 'view' : 'views'}`;
}

export function StoryFeedScreen({ navigation, route }: AppStackScreenProps<'StoryFeed'>) {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<StoryFeedStoryDto>>(null);
  const hasAppliedInitialIndexRef = useRef(false);
  const viewedStoryIdsRef = useRef<Set<number>>(new Set());
  const pendingAdvanceRef = useRef(false);
  const previousStoryCountRef = useRef(0);

  const [selectedSort] = useState<StoryFeedSort>(route.params?.sort ?? 'newest');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewCountOverrides, setViewCountOverrides] = useState<Record<number, number>>({});

  const hasCoordinates =
    typeof route.params?.latitude === 'number' && typeof route.params?.longitude === 'number';

  const baseQueryParams: StoryFeedQueryParams = {
    latitude: hasCoordinates ? route.params?.latitude : undefined,
    longitude: hasCoordinates ? route.params?.longitude : undefined,
    radius: hasCoordinates ? route.params?.radius : undefined,
    per_page: 20,
    sort: selectedSort,
  };

  const storyFeedQuery = useInfiniteQuery({
    queryKey: getStoryFeedQueryKey(baseQueryParams),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      getStoryFeed({
        ...baseQueryParams,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.pagination.meta;

      if (!meta || meta.current_page >= meta.last_page) {
        return undefined;
      }

      return meta.current_page + 1;
    },
  });

  const recordViewMutation = useMutation({
    mutationFn: recordStoryView,
    onSuccess: (story) => {
      if (typeof story.view_count === 'number') {
        setViewCountOverrides((current) => ({
          ...current,
          [story.id]: story.view_count ?? 0,
        }));
      }
    },
  });

  const stories = useMemo(
    () => storyFeedQuery.data?.pages.flatMap((page) => page.stories) ?? [],
    [storyFeedQuery.data],
  );
  const currentStory = stories[currentIndex] ?? null;
  const currentStoryId = currentStory?.id ?? null;
  const isInitialLoading = storyFeedQuery.isLoading && stories.length === 0;
  const isRefreshing = storyFeedQuery.isRefetching && !storyFeedQuery.isFetchingNextPage;

  function goToIndex(index: number, animated = true) {
    if (index < 0 || index >= stories.length) {
      return;
    }

    setProgress(0);
    setIsPaused(false);
    setCurrentIndex(index);
    listRef.current?.scrollToIndex({ index, animated });
  }

  function handleAdvance() {
    if (currentIndex < stories.length - 1) {
      goToIndex(currentIndex + 1);
      return;
    }

    if (storyFeedQuery.hasNextPage && !storyFeedQuery.isFetchingNextPage) {
      pendingAdvanceRef.current = true;
      void storyFeedQuery.fetchNextPage();
      return;
    }

    navigation.goBack();
  }

  function handleRetreat() {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
      return;
    }

    goToIndex(0, false);
  }

  function handleTogglePause() {
    setIsPaused((current) => !current);
  }

  async function openExternalUrl(url?: string | null, unavailableMessage?: string) {
    if (!url) {
      setActionError(unavailableMessage ?? 'This action is not available for this story.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setActionError('Unable to open the requested action on this device.');
    }
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);

    if (nextIndex !== currentIndex) {
      setProgress(0);
      setIsPaused(false);
      setCurrentIndex(nextIndex);
    }
  }

  useEffect(() => {
    if (!stories.length || hasAppliedInitialIndexRef.current) {
      return;
    }

    const initialStoryId = route.params?.initialStoryId;
    const initialIndex =
      typeof initialStoryId === 'number'
        ? stories.findIndex((story) => story.id === initialStoryId)
        : 0;

    const resolvedIndex = initialIndex >= 0 ? initialIndex : 0;

    setCurrentIndex(resolvedIndex);
    hasAppliedInitialIndexRef.current = true;

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: resolvedIndex,
        animated: false,
      });
    });
  }, [route.params?.initialStoryId, stories]);

  useEffect(() => {
    if (!stories.length) {
      previousStoryCountRef.current = 0;
      return;
    }

    if (pendingAdvanceRef.current && stories.length > previousStoryCountRef.current) {
      const nextIndex = Math.min(currentIndex + 1, stories.length - 1);

      pendingAdvanceRef.current = false;
      setProgress(0);
      setIsPaused(false);
      setCurrentIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }

    previousStoryCountRef.current = stories.length;
  }, [currentIndex, stories.length]);

  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
  }, [currentStoryId]);

  useEffect(() => {
    if (!currentStory) {
      return;
    }

    if (!viewedStoryIdsRef.current.has(currentStory.id)) {
      viewedStoryIdsRef.current.add(currentStory.id);
      recordViewMutation.mutate(currentStory.id);
    }

    if (
      currentIndex >= stories.length - 2
      && storyFeedQuery.hasNextPage
      && !storyFeedQuery.isFetchingNextPage
    ) {
      void storyFeedQuery.fetchNextPage();
    }
  }, [
    currentIndex,
    currentStory,
    recordViewMutation,
    stories.length,
    storyFeedQuery,
  ]);

  if (storyFeedQuery.isError && stories.length === 0) {
    return (
      <ErrorState
        title="Unable to load stories"
        message={getErrorMessage(storyFeedQuery.error)}
        actionLabel="Retry stories"
        onAction={() => {
          void storyFeedQuery.refetch();
        }}
      />
    );
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
        <View className="flex-1 items-center justify-center gap-md px-lg">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onPrimary }}>
            Loading stories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stories.length || !currentStory) {
    return (
      <ErrorState
        title="No active stories"
        message={
          hasCoordinates
            ? 'No active stories were found within the selected nearby radius.'
            : 'No active farmer stories are available right now.'
        }
        actionLabel="Reload stories"
        onAction={() => {
          void storyFeedQuery.refetch();
        }}
      />
    );
  }

  const viewCount = viewCountOverrides[currentStory.id] ?? currentStory.view_count ?? 0;
  const distanceLabel = formatDistance(currentStory.distance_km ?? currentStory.distance ?? null);
  const storeName = currentStory.store?.store_name ?? 'Store unavailable';
  const phoneNumber = currentStory.store?.actions?.phone ?? currentStory.store?.phone_number ?? null;
  const openMapsUrl =
    currentStory.store?.actions?.open_maps_action?.url
    ?? currentStory.store?.actions?.google_maps_url
    ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#050505' }}>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={stories}
          horizontal
          pagingEnabled
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <View
              style={{
                width,
                height,
                backgroundColor: '#050505',
              }}>
              <StoryViewerMedia
                story={item}
                isActive={index === currentIndex}
                isPaused={isPaused}
                onProgressChange={(value) => {
                  if (index === currentIndex) {
                    setProgress(value);
                  }
                }}
                onComplete={() => {
                  if (index === currentIndex) {
                    handleAdvance();
                  }
                }}
                onTogglePause={() => {
                  if (index === currentIndex) {
                    handleTogglePause();
                  }
                }}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          initialNumToRender={3}
          windowSize={3}
          onMomentumScrollEnd={handleScrollEnd}
          onRefresh={() => {
            void storyFeedQuery.refetch();
          }}
          refreshing={isRefreshing}
          onScrollToIndexFailed={() => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({
                offset: width * currentIndex,
                animated: false,
              });
            });
          }}
        />

        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            inset: 0,
            justifyContent: 'space-between',
          }}>
          <View className="gap-md px-md pt-sm">
            <View className="flex-row items-center justify-between">
              <IconButton
                icon="arrow-left"
                mode="contained"
                size={20}
                containerColor="rgba(0, 0, 0, 0.45)"
                iconColor={theme.colors.onPrimary}
                onPress={() => {
                  navigation.goBack();
                }}
              />

              <View className="flex-row items-center gap-sm">
                {route.params?.radius ? (
                  <Chip
                    compact
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                    textStyle={{ color: theme.colors.onPrimary }}>
                    {route.params.radius} km
                  </Chip>
                ) : null}
                <Chip
                  compact
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  textStyle={{ color: theme.colors.onPrimary }}>
                  {currentIndex + 1} / {stories.length}
                </Chip>
              </View>
            </View>

            <View className="flex-row gap-xs">
              {stories.map((story, index) => {
                const value = index < currentIndex ? 1 : index === currentIndex ? progress : 0;

                return (
                  <View
                    key={story.id}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    }}>
                    <View
                      style={{
                        width: `${Math.max(0, Math.min(value, 1)) * 100}%`,
                        height: '100%',
                        backgroundColor: theme.colors.onPrimary,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            <View className="gap-sm">
              <View className="flex-row items-center justify-between gap-md">
                <View className="flex-1 flex-row items-center gap-md">
                  <View
                    className="items-center justify-center overflow-hidden rounded-full"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    }}>
                    {currentStory.store?.store_logo_url ? (
                      <Image
                        source={{ uri: currentStory.store.store_logo_url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                        Store
                      </Text>
                    )}
                  </View>

                  <View className="flex-1 gap-xs">
                    <Text variant="titleLarge" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                      {storeName}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: 'rgba(255, 255, 255, 0.82)' }}>
                      {distanceLabel}
                    </Text>
                  </View>
                </View>

                <IconButton
                  icon={isPaused ? 'play' : 'pause'}
                  mode="contained"
                  size={20}
                  containerColor="rgba(0, 0, 0, 0.45)"
                  iconColor={theme.colors.onPrimary}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleTogglePause();
                  }}
                  accessibilityLabel={isPaused ? 'Resume story' : 'Pause story'}
                />
              </View>

              <View className="flex-row flex-wrap gap-sm">
                <Chip
                  compact
                  icon="eye-outline"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  textStyle={{ color: theme.colors.onPrimary }}>
                  {formatViewCount(viewCount)}
                </Chip>
                <Chip
                  compact
                  icon={currentStory.media_type === 'video' ? 'video-outline' : 'image-outline'}
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  textStyle={{ color: theme.colors.onPrimary }}>
                  {currentStory.media_type === 'video' ? 'Video Story' : 'Image Story'}
                </Chip>
                {currentStory.store?.district ? (
                  <Chip
                    compact
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                    textStyle={{ color: theme.colors.onPrimary }}>
                    {currentStory.store.district}
                  </Chip>
                ) : null}
              </View>
            </View>
          </View>

          <View className="gap-md px-md pb-lg">
            <View
              className="gap-md rounded-3xl p-lg"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
              <View className="gap-sm">
                <Text variant="titleMedium" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                  {currentStory.caption?.trim() || 'Fresh update from this store'}
                </Text>
                <Text variant="bodyMedium" style={{ color: 'rgba(255, 255, 255, 0.82)' }}>
                  Swipe left or right to move between nearby stories. Tap anywhere to pause or
                  resume the current story.
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-sm">
                <Button
                  mode="contained"
                  icon="phone-outline"
                  onPress={() => {
                    void openExternalUrl(
                      phoneNumber ? `tel:${phoneNumber}` : null,
                      'This farmer has not added a phone number yet.',
                    );
                  }}>
                  Call Farmer
                </Button>
                <Button
                  mode="outlined"
                  textColor={theme.colors.onPrimary}
                  icon="storefront-outline"
                  onPress={() => {
                    if (!currentStory.store?.id) {
                      setActionError('Store details are not available for this story.');
                      return;
                    }

                    navigation.navigate('StoreDetails', {
                      storeId: String(currentStory.store.id),
                      latitude: route.params?.latitude,
                      longitude: route.params?.longitude,
                      distanceKm: currentStory.distance_km ?? currentStory.distance ?? null,
                    });
                  }}>
                  Open Store
                </Button>
                <Button
                  mode="outlined"
                  textColor={theme.colors.onPrimary}
                  icon="shopping-outline"
                  onPress={() => {
                    if (!currentStory.store?.id) {
                      setActionError('Store products are not available for this story.');
                      return;
                    }

                    navigation.navigate('StoreDetails', {
                      storeId: String(currentStory.store.id),
                      latitude: route.params?.latitude,
                      longitude: route.params?.longitude,
                      distanceKm: currentStory.distance_km ?? currentStory.distance ?? null,
                    });
                  }}>
                  View Products
                </Button>
                <Button
                  mode="text"
                  textColor={theme.colors.onPrimary}
                  icon="map-marker-path"
                  onPress={() => {
                    void openExternalUrl(
                      openMapsUrl,
                      'Directions are not available for this story yet.',
                    );
                  }}>
                  Directions
                </Button>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Button
                mode="text"
                textColor={theme.colors.onPrimary}
                icon="chevron-left"
                onPress={handleRetreat}>
                Previous
              </Button>

              {storyFeedQuery.isFetchingNextPage ? (
                <View className="flex-row items-center gap-sm">
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                  <Text variant="bodySmall" style={{ color: theme.colors.onPrimary }}>
                    Loading more
                  </Text>
                </View>
              ) : null}

              <Button
                mode="text"
                textColor={theme.colors.onPrimary}
                icon="chevron-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
                onPress={handleAdvance}>
                Next
              </Button>
            </View>
          </View>
        </View>
      </View>

      <Snackbar visible={Boolean(actionError)} onDismiss={() => setActionError(null)}>
        {actionError}
      </Snackbar>
    </SafeAreaView>
  );
}

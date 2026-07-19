import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Chip, Searchbar, Snackbar, Text } from 'react-native-paper';

import {
  getMarketplace,
  getMarketplaceProduct,
  getMarketplaceProductQueryKey,
  getMarketplaceQueryKey,
  type MarketplaceListingDto,
  type MarketplaceQueryParams,
  type NearbyProductSuggestionDto,
} from '@/api/marketplace.api';
import { getStoryFeed, getStoryFeedQueryKey } from '@/api/story-feed.api';
import { ErrorState } from '@/components/common/error-state';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { MarketplaceRecommendationSection } from '@/components/marketplace/MarketplaceRecommendationSection';
import { StoriesRow } from '@/components/stories/StoriesRow';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

const LOCATION_PERMISSION_STORAGE_KEY = 'marketplace-location-prompted';

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
  { label: '100 km', value: 100 },
  { label: 'All Sri Lanka', value: 'all' as const },
] as const;

type RadiusOptionValue = (typeof RADIUS_OPTIONS)[number]['value'];

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function MarketplaceScreen({ navigation }: AppTabScreenProps<'Marketplace'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<RadiusOptionValue>(50);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<
    'checking' | 'granted' | 'denied' | 'unavailable'
  >('checking');
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAllSriLanka = selectedRadius === 'all';
  const shouldUseLocation = Boolean(coordinates) && !isAllSriLanka;
  const baseQueryParams: MarketplaceQueryParams = {
    search: submittedSearch.trim() || undefined,
    latitude: shouldUseLocation ? coordinates?.latitude : undefined,
    longitude: shouldUseLocation ? coordinates?.longitude : undefined,
    radius: shouldUseLocation ? selectedRadius : undefined,
    per_page: 10,
    sort: shouldUseLocation ? 'distance' : 'newest',
  };

  const openExternalUrl = useCallback(async (url?: string | null) => {
    if (!url) {
      setActionError('This action is not available for the selected listing.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setActionError('Unable to open the requested action on this device.');
    }
  }, []);

  const resolveCurrentLocation = useCallback(async () => {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setCoordinates({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  }, []);

  const requestLocationPermission = useCallback(async (forcePrompt = false) => {
    setIsResolvingLocation(true);

    try {
      if (forcePrompt) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          setLocationState('denied');
          return;
        }

        setLocationState('granted');
        await resolveCurrentLocation();
        return;
      }

      const existingPermission = await Location.getForegroundPermissionsAsync();
      const hasPromptedBefore = await AsyncStorage.getItem(LOCATION_PERMISSION_STORAGE_KEY);

      if (existingPermission.granted) {
        setLocationState('granted');
        await resolveCurrentLocation();
        return;
      }

      if (!hasPromptedBefore) {
        await AsyncStorage.setItem(LOCATION_PERMISSION_STORAGE_KEY, 'true');
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          setLocationState('denied');
          return;
        }

        setLocationState('granted');
        await resolveCurrentLocation();
        return;
      }

      setLocationState('denied');
    } catch {
      setLocationState('unavailable');
    } finally {
      setIsResolvingLocation(false);
    }
  }, [resolveCurrentLocation]);

  useEffect(() => {
    void requestLocationPermission();
  }, [requestLocationPermission]);

  const marketplaceQuery = useInfiniteQuery({
    queryKey: getMarketplaceQueryKey(baseQueryParams),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      getMarketplace({
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
  const storyFeedQuery = useQuery({
    queryKey: getStoryFeedQueryKey({
      latitude: shouldUseLocation ? coordinates?.latitude : undefined,
      longitude: shouldUseLocation ? coordinates?.longitude : undefined,
      radius: shouldUseLocation && typeof selectedRadius === 'number' ? selectedRadius : undefined,
      sort: shouldUseLocation ? 'distance' : 'newest',
      per_page: 10,
    }),
    queryFn: () =>
      getStoryFeed({
        latitude: shouldUseLocation ? coordinates?.latitude : undefined,
        longitude: shouldUseLocation ? coordinates?.longitude : undefined,
        radius: shouldUseLocation && typeof selectedRadius === 'number' ? selectedRadius : undefined,
        sort: shouldUseLocation ? 'distance' : 'newest',
        per_page: 10,
      }),
  });

  const listings = marketplaceQuery.data?.pages.flatMap((page) => page.listings) ?? [];
  const summary = marketplaceQuery.data?.pages[0] ?? null;
  const recommendedForYou = summary?.recommended_for_you ?? summary?.nearby_suggestions ?? [];
  const storyFeed = storyFeedQuery.data?.stories ?? [];
  const isInitialLoading = marketplaceQuery.isLoading && listings.length === 0;
  const isRefreshing = marketplaceQuery.isRefetching && !marketplaceQuery.isFetchingNextPage;

  async function handleRefresh() {
    if (locationState === 'granted') {
      try {
        await resolveCurrentLocation();
      } catch {
        // Keep using the last known coordinates when a refresh lookup fails.
      }
    }

    await marketplaceQuery.refetch();
    await storyFeedQuery.refetch();
  }

  function handleSearchSubmit() {
    setSubmittedSearch(searchDraft.trim());
  }

  async function handleCallFarmer(listingId: number) {
    try {
      const details = await queryClient.fetchQuery({
        queryKey: getMarketplaceProductQueryKey(listingId),
        queryFn: () => getMarketplaceProduct(listingId),
      });

      const phoneNumber = details.contact.phone ?? details.store?.phone_number ?? null;

      if (!phoneNumber) {
        setActionError('Phone number is not available for this farmer.');
        return;
      }

      await openExternalUrl(`tel:${phoneNumber}`);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  function handleDirections(item: MarketplaceListingDto | NearbyProductSuggestionDto) {
    void openExternalUrl(item.open_maps_action?.url ?? item.google_maps_url ?? null);
  }

  function renderItem({
    item,
  }: {
    item: MarketplaceListingDto;
  }) {
    return (
      <View className="px-md pb-md">
        <MarketplaceProductCard
          item={item}
          onPress={() => {
            navigation.navigate('MarketplaceProductDetails', {
              listingId: String(item.id),
              latitude: coordinates?.latitude,
              longitude: coordinates?.longitude,
              distanceKm: item.distance_km ?? item.distance ?? null,
            });
          }}
          onCallPress={() => {
            void handleCallFarmer(item.id);
          }}
          onDirectionsPress={() => {
            handleDirections(item);
          }}
        />
      </View>
    );
  }

  if (marketplaceQuery.isError && listings.length === 0) {
    return (
      <ErrorState
        title="Unable to load marketplace"
        message={getErrorMessage(marketplaceQuery.error)}
        actionLabel="Retry marketplace"
        onAction={() => {
          void marketplaceQuery.refetch();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshing={isRefreshing}
        onRefresh={() => {
          void handleRefresh();
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (marketplaceQuery.hasNextPage && !marketplaceQuery.isFetchingNextPage) {
            void marketplaceQuery.fetchNextPage();
          }
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View className="gap-md px-md pb-md">
            <View
              className="gap-sm rounded-lg border px-lg py-lg"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              }}>
              <Chip compact style={{ alignSelf: 'flex-start' }}>
                Smart Marketplace
              </Chip>
              <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
                {shouldUseLocation ? 'Nearby Products' : 'Marketplace'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Search vegetables, compare nearby produce, and jump straight to farmer contact and
                directions.
              </Text>
              {shouldUseLocation ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Using your current location with a{' '}
                  {typeof selectedRadius === 'number' ? `${selectedRadius} km` : 'countrywide'}{' '}
                  radius.
                </Text>
              ) : locationState === 'denied' || locationState === 'unavailable' ? (
                <View
                  className="gap-sm rounded-md px-md py-md"
                  style={{ backgroundColor: theme.colors.secondaryContainer }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                    Location is off, so you are seeing results from across Sri Lanka. Enable
                    location to sort by distance and unlock nearby suggestions.
                  </Text>
                  <Button mode="contained-tonal" onPress={() => void requestLocationPermission(true)}>
                    Enable Location
                  </Button>
                </View>
              ) : null}
            </View>

            <Searchbar
              placeholder="Search vegetables..."
              value={searchDraft}
              onChangeText={setSearchDraft}
              onIconPress={handleSearchSubmit}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              accessibilityLabel="Search marketplace listings"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-sm">
                {RADIUS_OPTIONS.map((option) => {
                  const isSelected = selectedRadius === option.value;

                  return (
                    <Chip
                      key={option.label}
                      accessibilityLabel={`Filter results within ${option.label}`}
                      onPress={() => {
                        setSelectedRadius(option.value);
                      }}
                      selected={isSelected}
                      showSelectedCheck={false}
                      style={{
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                      }}>
                      {option.label}
                    </Chip>
                  );
                })}
              </View>
            </ScrollView>

            <StoriesRow
              stories={storyFeed}
              title={shouldUseLocation ? 'Nearby Stories' : 'Latest Stories'}
              subtitle={
                shouldUseLocation
                  ? 'Browse active farmer updates from stores around your selected search radius.'
                  : 'See the newest active stories from farmer stores.'
              }
              onStoryPress={(story) => {
                navigation.navigate('StoryFeed', {
                  initialStoryId: story.id,
                  latitude: coordinates?.latitude,
                  longitude: coordinates?.longitude,
                  radius:
                    shouldUseLocation && typeof selectedRadius === 'number'
                      ? selectedRadius
                      : undefined,
                  sort: shouldUseLocation ? 'distance' : 'newest',
                });
              }}
              onViewAllPress={() => {
                navigation.navigate('StoryFeed', {
                  latitude: coordinates?.latitude,
                  longitude: coordinates?.longitude,
                  radius:
                    shouldUseLocation && typeof selectedRadius === 'number'
                      ? selectedRadius
                      : undefined,
                  sort: shouldUseLocation ? 'distance' : 'newest',
                });
              }}
            />

            {isResolvingLocation ? (
              <View className="flex-row items-center gap-sm px-sm">
                <ActivityIndicator size="small" />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Updating your location...
                </Text>
              </View>
            ) : null}

            {summary?.message ? (
              <View
                className="rounded-md px-md py-md"
                style={{ backgroundColor: theme.colors.secondaryContainer }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                  {summary.message}
                </Text>
              </View>
            ) : null}

            {summary ? (
              <View className="flex-row flex-wrap gap-sm">
                <Chip compact>{summary.results_found} products found</Chip>
                {summary.used_radius ? (
                  <Chip compact>
                    Radius:{' '}
                    {typeof summary.used_radius === 'number'
                      ? `${summary.used_radius} km`
                      : 'All Sri Lanka'}
                  </Chip>
                ) : null}
                {summary.expanded ? <Chip compact>Expanded search</Chip> : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <View className="flex-1 items-center justify-center gap-md px-lg">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading marketplace products...
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-md px-lg">
              <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
                No products found
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {shouldUseLocation
                  ? `No products found within ${selectedRadius} km.`
                  : 'No products matched the current search and filter settings.'}
              </Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setSearchDraft('');
                  setSubmittedSearch('');
                  setSelectedRadius(50);
                }}>
                Reset Filters
              </Button>
            </View>
          )
        }
        ListFooterComponent={
          <View className="gap-md px-md">
            <MarketplaceRecommendationSection
              items={recommendedForYou}
              subtitle="Nearby products selected from your current search, store distance, and seasonal availability."
              onItemPress={(item) => {
                navigation.navigate('MarketplaceProductDetails', {
                  listingId: String(item.id),
                  latitude: coordinates?.latitude,
                  longitude: coordinates?.longitude,
                  distanceKm: item.distance_km ?? item.distance ?? null,
                });
              }}
              onCallPress={(item) => {
                void handleCallFarmer(item.id);
              }}
              onDirectionsPress={(item) => {
                handleDirections(item);
              }}
            />

            {marketplaceQuery.isFetchingNextPage ? (
              <View className="flex-row items-center justify-center gap-sm py-md">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Loading more products...
                </Text>
              </View>
            ) : null}
          </View>
        }
      />

      <Snackbar visible={Boolean(actionError)} onDismiss={() => setActionError(null)}>
        {actionError}
      </Snackbar>
    </SafeAreaView>
  );
}

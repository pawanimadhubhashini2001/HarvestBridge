import { Image } from 'expo-image';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FlatList,
  Linking,
  type ListRenderItem,
  Share,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  Snackbar,
  Text,
} from 'react-native-paper';

import type { MarketplaceListingDto } from '@/api/marketplace.api';
import {
  getPublicStoreDetails,
  getPublicStoreDetailsQueryKey,
  getPublicStoreProducts,
  getPublicStoreProductsQueryKey,
  type PublicStoreQueryParams,
} from '@/api/store.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatStoreStatus } from '@/utils/store-status';

function formatDistance(distance?: number | null) {
  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return null;
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km away`;
}

export function StoreDetailsScreen({
  navigation,
  route,
}: AppStackScreenProps<'StoreDetails'>) {
  const theme = useAppTheme();
  const storeId = route.params?.storeId;
  const [actionError, setActionError] = useState<string | null>(null);

  const queryParams: PublicStoreQueryParams =
    typeof route.params?.latitude === 'number' && typeof route.params?.longitude === 'number'
      ? {
          latitude: route.params.latitude,
          longitude: route.params.longitude,
          per_page: 10,
        }
      : {
          per_page: 10,
        };

  const detailsQuery = useQuery({
    queryKey: getPublicStoreDetailsQueryKey(storeId ?? 'missing', queryParams),
    queryFn: () => getPublicStoreDetails(storeId ?? '', queryParams),
    enabled: Boolean(storeId),
  });

  const productsQuery = useInfiniteQuery({
    queryKey: getPublicStoreProductsQueryKey(storeId ?? 'missing', queryParams),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getPublicStoreProducts(storeId ?? '', {
        ...queryParams,
        page: pageParam,
      }),
    enabled: Boolean(storeId),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.pagination.meta;

      if (!meta || meta.current_page >= meta.last_page) {
        return undefined;
      }

      return meta.current_page + 1;
    },
  });

  const products = productsQuery.data?.pages.flatMap((page) => page.products) ?? [];
  const isInitialLoading =
    (detailsQuery.isLoading && !detailsQuery.data)
    || (productsQuery.isLoading && products.length === 0);
  const isRefreshing =
    detailsQuery.isRefetching
    || (productsQuery.isRefetching && !productsQuery.isFetchingNextPage);

  async function openExternalUrl(url?: string | null) {
    if (!url) {
      setActionError('This action is not available for this store.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setActionError('Unable to open the requested action on this device.');
    }
  }

  async function shareStore() {
    if (!detailsQuery.data?.actions.share_url) {
      setActionError('Share link is not available for this store.');
      return;
    }

    try {
      await Share.share({
        message: `Check out ${detailsQuery.data.store_name} on HarvestBridge: ${detailsQuery.data.actions.share_url}`,
        url: detailsQuery.data.actions.share_url,
      });
    } catch {
      setActionError('Unable to share this store right now.');
    }
  }

  async function handleRefresh() {
    await Promise.all([detailsQuery.refetch(), productsQuery.refetch()]);
  }

  const distanceLabel =
    formatDistance(detailsQuery.data?.distance_km ?? route.params?.distanceKm ?? null);

  const renderProduct: ListRenderItem<MarketplaceListingDto> = ({ item }) => (
    <View className="px-md pb-md">
      <MarketplaceProductCard
        item={item}
        onPress={() => {
          navigation.navigate('MarketplaceProductDetails', {
            listingId: String(item.id),
            latitude: route.params?.latitude,
            longitude: route.params?.longitude,
            distanceKm: item.distance_km ?? item.distance ?? null,
          });
        }}
        onCallPress={() => {
          void openExternalUrl(
            detailsQuery.data?.actions.phone ? `tel:${detailsQuery.data.actions.phone}` : null,
          );
        }}
        onDirectionsPress={() => {
          void openExternalUrl(
            detailsQuery.data?.location.open_maps_action?.url
              ?? detailsQuery.data?.location.google_maps_url
              ?? null,
          );
        }}
      />
    </View>
  );

  if (!storeId) {
    return (
      <ErrorState
        title="Store not found"
        message="The selected store could not be identified."
      />
    );
  }

  if (detailsQuery.isError && !detailsQuery.data) {
    return (
      <ErrorState
        title="Unable to load store"
        message={getErrorMessage(detailsQuery.error)}
        actionLabel="Retry store"
        onAction={() => {
          void detailsQuery.refetch();
        }}
      />
    );
  }

  if (productsQuery.isError && products.length === 0 && !detailsQuery.data) {
    return (
      <ErrorState
        title="Unable to load store products"
        message={getErrorMessage(productsQuery.error)}
        actionLabel="Retry products"
        onAction={() => {
          void productsQuery.refetch();
        }}
      />
    );
  }

  if (isInitialLoading) {
    return <LoadingState message="Loading store details..." />;
  }

  if (!detailsQuery.data) {
    return (
      <ErrorState
        title="Store unavailable"
        message="This store is not available right now."
      />
    );
  }

  const store = detailsQuery.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
        refreshing={isRefreshing}
        onRefresh={() => {
          void handleRefresh();
        }}
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
            void productsQuery.fetchNextPage();
          }
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View className="gap-md px-md pb-md">
            <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
              <View>
                {store.store_cover_image_url ? (
                  <Image
                    source={{ uri: store.store_cover_image_url }}
                    style={{
                      width: '100%',
                      height: 220,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center"
                    style={{
                      height: 180,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      No cover image available
                    </Text>
                  </View>
                )}

                <View className="gap-md p-lg">
                  <View className="flex-row gap-md">
                    <View
                      className="items-center justify-center overflow-hidden rounded-xl"
                      style={{
                        width: 84,
                        height: 84,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}>
                      {store.store_logo_url ? (
                        <Image
                          source={{ uri: store.store_logo_url }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text
                          variant="labelMedium"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            textAlign: 'center',
                          }}>
                          No Logo
                        </Text>
                      )}
                    </View>

                    <View className="flex-1 gap-sm">
                      <View className="gap-xs">
                        <Chip compact style={{ alignSelf: 'flex-start' }}>
                          Public Store
                        </Chip>
                        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                          {store.store_name}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={{ color: theme.colors.onSurfaceVariant }}>
                          {store.store_description?.trim()
                            || 'No store description has been added yet.'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-sm">
                    {store.business_status ? (
                      <Chip compact>{formatStoreStatus(store.business_status)}</Chip>
                    ) : null}
                    {distanceLabel ? <Chip compact icon="map-marker-distance">{distanceLabel}</Chip> : null}
                    {store.district ? <Chip compact>{store.district}</Chip> : null}
                    <Chip compact>{store.active_products_count} active products</Chip>
                  </View>

                  <View className="flex-row flex-wrap gap-sm">
                    <Button
                      mode="contained"
                      icon="phone-outline"
                      onPress={() => {
                        void openExternalUrl(
                          store.actions.phone ? `tel:${store.actions.phone}` : null,
                        );
                      }}>
                      Call Farmer
                    </Button>
                    <Button
                      mode="outlined"
                      icon="map-marker-path"
                      onPress={() => {
                        void openExternalUrl(
                          store.location.open_maps_action?.url
                            ?? store.location.google_maps_url
                            ?? null,
                        );
                      }}>
                      Open Google Maps
                    </Button>
                    <Button mode="contained-tonal" icon="share-variant-outline" onPress={() => void shareStore()}>
                      Share Store
                    </Button>
                  </View>
                </View>
              </View>
            </Card>

            <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
              <View className="gap-md p-lg">
                <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                  Store Information
                </Text>

                <View className="gap-sm">
                  <Text variant="bodyMedium">
                    Owner: {store.owner?.name ?? 'Not available'}
                  </Text>
                  <Text variant="bodyMedium">
                    Phone Number: {store.phone_number ?? 'Not available'}
                  </Text>
                  <Text variant="bodyMedium">
                    District: {store.location.district ?? 'Not available'}
                  </Text>
                  <Text variant="bodyMedium">
                    Address: {store.location.address ?? 'Not available'}
                  </Text>
                </View>

                <Divider />

                <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                  Active Harvest Listings
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Browse the latest active products published by this farmer.
                </Text>
              </View>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-md px-lg">
            <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
              No active products yet
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              This store does not have any active harvest listings right now.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View className="gap-md px-md">
            {productsQuery.isError && products.length > 0 ? (
              <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
                <View className="gap-sm p-md">
                  <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                    Unable to load more products
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {getErrorMessage(productsQuery.error)}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      void productsQuery.refetch();
                    }}>
                    Retry products
                  </Button>
                </View>
              </Card>
            ) : null}

            {productsQuery.isFetchingNextPage ? (
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

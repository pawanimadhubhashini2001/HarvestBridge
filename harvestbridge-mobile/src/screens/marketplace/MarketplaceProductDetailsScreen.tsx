import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { Button, Card, Chip, Divider, IconButton, Snackbar, Text } from 'react-native-paper';

import { favoriteProduct, getFavoritesQueryKey, unfavoriteProduct } from '@/api/favorites.api';
import {
  getMarketplaceProduct,
  getMarketplaceProductQueryKey,
  type MarketplaceQueryParams,
} from '@/api/marketplace.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { MarketplaceRecommendationSection } from '@/components/marketplace/MarketplaceRecommendationSection';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { estimateTravelDirection, formatStoreCoordinates } from '@/utils/store-location';
import { formatStoreStatus } from '@/utils/store-status';
import { useState } from 'react';

function formatCurrency(value: number | string, unit?: string) {
  const amount = Number(value);
  const formattedAmount = Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
      }).format(amount)
    : `LKR ${value}`;

  return unit ? `${formattedAmount} / ${unit}` : formattedAmount;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDistance(distance?: number | null) {
  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return 'Distance unavailable';
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km away`;
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function MarketplaceProductDetailsScreen({
  navigation,
  route,
}: AppStackScreenProps<'MarketplaceProductDetails'>) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listingId = route.params?.listingId;
  const [actionError, setActionError] = useState<string | null>(null);
  const isConsumer = user?.role === 'consumer';
  const isNarrow = width < 390;
  const detailImageWidth = Math.min(width - 64, 320);
  const actionButtonStyle = isNarrow ? { flexGrow: 1 } : undefined;
  const detailQueryParams: Pick<MarketplaceQueryParams, 'latitude' | 'longitude'> =
    typeof route.params?.latitude === 'number' && typeof route.params?.longitude === 'number'
      ? {
          latitude: route.params.latitude,
          longitude: route.params.longitude,
        }
      : {};
  const detailsQuery = useQuery({
    queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing', detailQueryParams),
    queryFn: () => getMarketplaceProduct(listingId ?? '', detailQueryParams),
    enabled: Boolean(listingId),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (shouldFavorite: boolean) => {
      if (!listingId) {
        throw new Error('The selected marketplace product could not be identified.');
      }

      if (shouldFavorite) {
        return favoriteProduct(listingId);
      }

      return unfavoriteProduct(listingId);
    },
    onSuccess: async (_, shouldFavorite) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing', detailQueryParams),
        }),
        queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
        queryClient.invalidateQueries({ queryKey: getFavoritesQueryKey() }),
      ]);
      setActionError(
        shouldFavorite ? 'Product saved to favorites.' : 'Product removed from favorites.',
      );
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  async function openExternalUrl(url?: string | null) {
    if (!url) {
      setActionError('This action is not available for this product.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setActionError('Unable to open the requested action on this device.');
    }
  }

  async function shareProduct() {
    if (!detailsQuery.data?.contact.share_url) {
      setActionError('Share link is not available for this product.');
      return;
    }

    try {
      await Share.share({
        message: `Check out ${detailsQuery.data.product.crop_name ?? 'this product'} on HarvestBridge: ${detailsQuery.data.contact.share_url}`,
        url: detailsQuery.data.contact.share_url,
      });
    } catch {
      setActionError('Unable to share this product right now.');
    }
  }

  async function handleCallFarmer(targetListingId: number) {
    try {
      const details = await queryClient.fetchQuery({
        queryKey: getMarketplaceProductQueryKey(targetListingId, detailQueryParams),
        queryFn: () => getMarketplaceProduct(targetListingId, detailQueryParams),
      });

      const phoneNumber = details.contact.phone ?? details.store?.phone_number ?? null;

      await openExternalUrl(phoneNumber ? `tel:${phoneNumber}` : null);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  if (!listingId) {
    return (
      <ErrorState
        title="Product not found"
        message="The selected marketplace product could not be identified."
      />
    );
  }

  if (detailsQuery.isLoading && !detailsQuery.data) {
    return <LoadingState message="Loading product details..." />;
  }

  if (detailsQuery.isError && !detailsQuery.data) {
    return (
      <ErrorState
        title="Unable to load product"
        message={getErrorMessage(detailsQuery.error)}
        actionLabel="Retry product"
        onAction={() => {
          void detailsQuery.refetch();
        }}
      />
    );
  }

  if (!detailsQuery.data) {
    return (
      <ErrorState
        title="Product unavailable"
        message="This marketplace product is not available right now."
      />
    );
  }

  const {
    product,
    contact,
    farmer,
    store,
    store_location: storeLocation,
    recommended_products: recommendedProducts,
    related_products: relatedProducts,
  } = detailsQuery.data;
  const isFavorite = Boolean(product.is_favorite);
  const hasImages = product.images.length > 0;
  const distanceLabel = formatDistance(storeLocation?.distance_km ?? route.params?.distanceKm ?? null);
  const estimatedDirection = estimateTravelDirection(
    route.params?.latitude,
    route.params?.longitude,
    storeLocation?.latitude,
    storeLocation?.longitude,
  );
  const coordinatesLabel = formatStoreCoordinates(
    storeLocation?.latitude,
    storeLocation?.longitude,
  );

  return (
    <Screen
      scrollable
      refreshing={detailsQuery.isRefetching}
      onRefresh={() => {
        void detailsQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-md">
          <View className="gap-sm">
            <View className="flex-row items-start justify-between gap-sm">
              <View className="flex-1 gap-sm">
                <Chip compact style={{ alignSelf: 'flex-start' }}>
                  Product Details
                </Chip>
                <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                  {product.crop_name ?? 'Marketplace Product'}
                </Text>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {formatCurrency(product.price_per_unit, product.unit)}
                </Text>
              </View>
              {isConsumer ? (
                <IconButton
                  icon={isFavorite ? 'heart' : 'heart-outline'}
                  iconColor={isFavorite ? theme.colors.error : theme.colors.primary}
                  disabled={favoriteMutation.isPending}
                  onPress={() => {
                    void favoriteMutation.mutateAsync(!isFavorite);
                  }}
                  accessibilityLabel={
                    isFavorite ? 'Remove product from favorites' : 'Save product to favorites'
                  }
                />
              ) : null}
            </View>
          </View>

          {hasImages ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-sm">
                {product.images.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.url }}
                    style={{
                      width: detailImageWidth,
                      height: 180,
                      borderRadius: 12,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                    contentFit="cover"
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <View
              className="items-center justify-center rounded-lg"
              style={{
                height: 180,
                backgroundColor: theme.colors.surfaceVariant,
              }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No product images available
              </Text>
            </View>
          )}

          <View className="flex-row flex-wrap gap-sm">
            <Chip compact>{product.status_label ?? formatStatusLabel(product.status)}</Chip>
            {product.quality_grade ? <Chip compact>Grade {product.quality_grade}</Chip> : null}
            <Chip compact>{product.available_quantity} {product.unit} available</Chip>
            {storeLocation?.district ? <Chip compact>{storeLocation.district}</Chip> : null}
          </View>

          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {product.description?.trim() || 'No description was provided for this listing.'}
          </Text>

          <View className="flex-row flex-wrap gap-sm">
            {isConsumer ? (
              <Button
                mode="contained"
                icon="basket-outline"
                disabled={!product.is_available}
                style={actionButtonStyle}
                contentStyle={{ minHeight: 44 }}
                onPress={() => {
                  navigation.navigate('OrderCheckout', {
                    listingId: String(product.id),
                  });
                }}>
                Order Now
              </Button>
            ) : null}
            <Button
              mode="contained"
              icon="phone-outline"
              style={actionButtonStyle}
              contentStyle={{ minHeight: 44 }}
              onPress={() => void openExternalUrl(contact.phone ? `tel:${contact.phone}` : null)}>
              Call Farmer
            </Button>
            <Button
              mode="outlined"
              icon="map-marker-path"
              style={actionButtonStyle}
              contentStyle={{ minHeight: 44 }}
              onPress={() => void openExternalUrl(storeLocation?.open_maps_action?.url ?? storeLocation?.google_maps_url)}>
              Directions
            </Button>
            <Button
              mode="outlined"
              icon="share-variant-outline"
              style={actionButtonStyle}
              contentStyle={{ minHeight: 44 }}
              onPress={() => void shareProduct()}>
              Share Product
            </Button>
            {store?.id ? (
              <Button
                mode="contained-tonal"
                icon="storefront-outline"
                style={actionButtonStyle}
                contentStyle={{ minHeight: 44 }}
                onPress={() => {
                  navigation.navigate('StoreDetails', {
                    storeId: String(store.id),
                    latitude: route.params?.latitude,
                    longitude: route.params?.longitude,
                    distanceKm: storeLocation?.distance_km ?? route.params?.distanceKm ?? null,
                  });
                }}>
                View Store
              </Button>
            ) : null}
          </View>
        </View>
      </Card>

      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-md">
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            Product Information
          </Text>
          <View className="gap-sm">
            <Text variant="bodyMedium">Crop Category: {product.crop_category ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Description: {product.description?.trim() || 'Not available'}</Text>
            <Text variant="bodyMedium">Price: {formatCurrency(product.price_per_unit, product.unit)}</Text>
            <Text variant="bodyMedium">Available Quantity: {product.available_quantity} {product.unit}</Text>
            <Text variant="bodyMedium">Harvest Date: {formatDate(product.harvest_date)}</Text>
            <Text variant="bodyMedium">Available Until: {formatDate(product.available_until)}</Text>
            <Text variant="bodyMedium">Quality Grade: {product.quality_grade ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Last Updated: {formatDate(product.updated_at)}</Text>
          </View>
        </View>
      </Card>

      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-md">
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            Store Information
          </Text>
          <View className="gap-sm">
            <View className={`${isNarrow ? 'gap-md' : 'flex-row items-center gap-md'}`}>
              <View
                className="items-center justify-center overflow-hidden rounded-xl"
                style={{
                  width: isNarrow ? '100%' : 72,
                  height: isNarrow ? 136 : 72,
                  backgroundColor: theme.colors.surfaceVariant,
                }}>
                {store?.store_logo_url ? (
                  <Image
                    source={{ uri: store.store_logo_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No Logo
                  </Text>
                )}
              </View>

              <View className="flex-1 gap-xs">
                <Text variant="bodyLarge" style={{ fontWeight: '700' }}>
                  {store?.store_name ?? 'Store unavailable'}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {store?.store_description?.trim() || 'No store description provided.'}
                </Text>
              </View>
            </View>
          </View>

          <Divider />

          <View className="gap-sm">
            <Text variant="bodyMedium">Farmer: {farmer?.name ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Phone: {store?.phone_number ?? contact.phone ?? 'Not available'}</Text>
            <Text variant="bodyMedium">
              Business Hours: {store?.business_hours ?? 'Not available'}
            </Text>
            <Text variant="bodyMedium">
              Business Status: {store?.business_status ? formatStoreStatus(store.business_status) : 'Not available'}
            </Text>
            <Text variant="bodyMedium">Distance: {distanceLabel}</Text>
            <Text variant="bodyMedium">
              Estimated Direction: {estimatedDirection ?? 'Not available'}
            </Text>
            <Text variant="bodyMedium">District: {storeLocation?.district ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Address: {storeLocation?.address ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Coordinates: {coordinatesLabel}</Text>
          </View>
        </View>
      </Card>

      {recommendedProducts.length > 0 ? (
        <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
          <View className="gap-md p-md">
            <MarketplaceRecommendationSection
              items={recommendedProducts}
              subtitle="Recommended nearby products based on this product's category and current harvest availability."
              onItemPress={(item) => {
                navigation.push('MarketplaceProductDetails', {
                  listingId: String(item.id),
                  latitude: route.params?.latitude,
                  longitude: route.params?.longitude,
                  distanceKm: item.distance_km ?? item.distance ?? null,
                });
              }}
              onCallPress={(item) => {
                void handleCallFarmer(item.id);
              }}
              onDirectionsPress={(item) => {
                void openExternalUrl(item.open_maps_action?.url ?? item.google_maps_url ?? null);
              }}
            />
          </View>
        </Card>
      ) : null}

      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-md">
          <View className="gap-xs">
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              Related Products
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              More available products from the same store.
            </Text>
          </View>

          {relatedProducts.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No related products are available from this store right now.
            </Text>
          ) : (
            <View className="gap-md">
              {relatedProducts.map((relatedProduct) => (
                <MarketplaceProductCard
                  key={`related-${relatedProduct.id}`}
                  item={relatedProduct}
                  compact
                  onPress={() => {
                    navigation.push('MarketplaceProductDetails', {
                      listingId: String(relatedProduct.id),
                      latitude: route.params?.latitude,
                      longitude: route.params?.longitude,
                      distanceKm: relatedProduct.distance_km ?? relatedProduct.distance ?? null,
                    });
                  }}
                  onCallPress={() => {
                    void handleCallFarmer(relatedProduct.id);
                  }}
                  onDirectionsPress={() => {
                    void openExternalUrl(
                      relatedProduct.open_maps_action?.url ?? relatedProduct.google_maps_url ?? null,
                    );
                  }}
                  onOrderPress={
                    isConsumer
                      ? () => {
                          navigation.navigate('OrderCheckout', {
                            listingId: String(relatedProduct.id),
                          });
                        }
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>
      </Card>

      <Snackbar visible={Boolean(actionError)} onDismiss={() => setActionError(null)}>
        {actionError}
      </Snackbar>
    </Screen>
  );
}

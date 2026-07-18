import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { Linking, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Divider, Snackbar, Text } from 'react-native-paper';

import {
  getMarketplaceProduct,
  getMarketplaceProductQueryKey,
} from '@/api/marketplace.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
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

function formatDistance(latitude?: number | string | null, longitude?: number | string | null) {
  if (!latitude || !longitude) {
    return 'Location not provided';
  }

  return `${latitude}, ${longitude}`;
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function MarketplaceProductDetailsScreen({
  route,
}: AppStackScreenProps<'MarketplaceProductDetails'>) {
  const theme = useAppTheme();
  const listingId = route.params?.listingId;
  const [actionError, setActionError] = useState<string | null>(null);
  const detailsQuery = useQuery({
    queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing'),
    queryFn: () => getMarketplaceProduct(listingId ?? ''),
    enabled: Boolean(listingId),
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

  const { product, contact, farmer, store, store_location: storeLocation } = detailsQuery.data;
  const hasImages = product.images.length > 0;

  return (
    <Screen
      scrollable
      refreshing={detailsQuery.isRefetching}
      onRefresh={() => {
        void detailsQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-lg">
          <View className="gap-sm">
            <Chip compact style={{ alignSelf: 'flex-start' }}>
              Product Details
            </Chip>
            <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
              {product.crop_name ?? 'Marketplace Product'}
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {formatCurrency(product.price_per_unit, product.unit)}
            </Text>
          </View>

          {hasImages ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-sm">
                {product.images.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.url }}
                    style={{
                      width: 260,
                      height: 180,
                      borderRadius: 16,
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
            <Chip compact>{formatStatusLabel(product.status)}</Chip>
            {product.quality_grade ? <Chip compact>Grade {product.quality_grade}</Chip> : null}
            <Chip compact>{product.available_quantity} {product.unit} available</Chip>
            {storeLocation?.district ? <Chip compact>{storeLocation.district}</Chip> : null}
          </View>

          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {product.description?.trim() || 'No description was provided for this listing.'}
          </Text>

          <View className="flex-row flex-wrap gap-sm">
            <Button mode="contained" icon="phone-outline" onPress={() => void openExternalUrl(contact.phone ? `tel:${contact.phone}` : null)}>
              Call Farmer
            </Button>
            <Button mode="outlined" icon="whatsapp" onPress={() => void openExternalUrl(contact.whatsapp)}>
              WhatsApp
            </Button>
            <Button mode="outlined" icon="map-marker-path" onPress={() => void openExternalUrl(storeLocation?.open_maps_action?.url ?? storeLocation?.google_maps_url)}>
              Google Maps
            </Button>
          </View>
        </View>
      </Card>

      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-lg">
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            Product Information
          </Text>
          <View className="gap-sm">
            <Text variant="bodyMedium">Crop Category: {product.crop_category ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Harvest Date: {formatDate(product.harvest_date)}</Text>
            <Text variant="bodyMedium">Available Until: {formatDate(product.available_until)}</Text>
            <Text variant="bodyMedium">Total Quantity: {product.quantity} {product.unit}</Text>
            <Text variant="bodyMedium">Reserved Quantity: {product.reserved_quantity} {product.unit}</Text>
            <Text variant="bodyMedium">Sold Quantity: {product.sold_quantity} {product.unit}</Text>
            <Text variant="bodyMedium">Last Updated: {formatDate(product.updated_at)}</Text>
          </View>
        </View>
      </Card>

      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-lg">
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            Store Information
          </Text>
          <View className="gap-sm">
            <Text variant="bodyLarge" style={{ fontWeight: '700' }}>
              {store?.store_name ?? 'Store unavailable'}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {store?.store_description?.trim() || 'No store description provided.'}
            </Text>
          </View>

          <Divider />

          <View className="gap-sm">
            <Text variant="bodyMedium">Farmer: {farmer?.name ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Phone: {store?.phone_number ?? contact.phone ?? 'Not available'}</Text>
            <Text variant="bodyMedium">
              Business Hours: {store?.business_hours ?? 'Not available'}
            </Text>
            <Text variant="bodyMedium">
              Business Status: {store?.business_status ?? 'Not available'}
            </Text>
            <Text variant="bodyMedium">District: {storeLocation?.district ?? 'Not available'}</Text>
            <Text variant="bodyMedium">Address: {storeLocation?.address ?? 'Not available'}</Text>
            <Text variant="bodyMedium">
              Coordinates: {formatDistance(storeLocation?.latitude, storeLocation?.longitude)}
            </Text>
          </View>
        </View>
      </Card>

      <Snackbar visible={Boolean(actionError)} onDismiss={() => setActionError(null)}>
        {actionError}
      </Snackbar>
    </Screen>
  );
}

import { Image } from 'expo-image';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import type { MarketplaceListingDto, NearbyProductSuggestionDto } from '@/api/marketplace.api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatStoreStatus } from '@/utils/store-status';

type MarketplaceCardItem = MarketplaceListingDto | NearbyProductSuggestionDto;

interface MarketplaceProductCardProps {
  item: MarketplaceCardItem;
  onPress: () => void;
  onCallPress: () => void;
  onDirectionsPress: () => void;
  compact?: boolean;
}

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

function formatDistance(distance?: number | null) {
  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return 'Distance unavailable';
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km away`;
}

function formatAvailability(item: MarketplaceCardItem) {
  const quantity = Number(item.available_quantity);

  if (!Number.isFinite(quantity)) {
    return item.status.replace('_', ' ');
  }

  return `${quantity} ${item.unit} left`;
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getPrimaryImageUrl(item: MarketplaceCardItem) {
  if ('images' in item && Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0]?.url ?? null;
  }

  return null;
}

export function MarketplaceProductCard({
  item,
  onPress,
  onCallPress,
  onDirectionsPress,
  compact = false,
}: MarketplaceProductCardProps) {
  const theme = useAppTheme();
  const imageUrl = getPrimaryImageUrl(item);
  const title = 'crop' in item ? item.crop : null;
  const storeName = item.store?.store_name ?? 'Store unavailable';
  const description = item.description?.trim();
  const recommendationReason = item.recommendation_reason?.trim();
  const distance = item.distance_km ?? item.distance ?? null;

  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={{ backgroundColor: theme.colors.surface }}>
      <View className={`flex-row ${compact ? 'gap-sm' : 'gap-md'} p-md`}>
        <View
          className="items-center justify-center overflow-hidden rounded-md"
          style={{
            width: compact ? 88 : 108,
            height: compact ? 88 : 108,
            backgroundColor: theme.colors.surfaceVariant,
          }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No Image
            </Text>
          )}
        </View>

        <View className="flex-1 gap-sm">
          <View className="flex-row items-start justify-between gap-sm">
            <View className="flex-1 gap-1">
              <Text variant={compact ? 'titleMedium' : 'titleLarge'} style={{ fontWeight: '700' }}>
                {title ?? 'Marketplace Product'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {storeName}
              </Text>
            </View>

            <Chip compact>{formatStatusLabel(item.status)}</Chip>
          </View>

          <View className="flex-row flex-wrap gap-xs">
            <Chip compact icon="map-marker-distance">
              {formatDistance(distance)}
            </Chip>
            {item.store?.business_status ? (
              <Chip compact>{formatStoreStatus(item.store.business_status)}</Chip>
            ) : null}
            {item.quality_grade ? <Chip compact>Grade {item.quality_grade}</Chip> : null}
            <Chip compact>{formatAvailability(item)}</Chip>
          </View>

          <Text variant={compact ? 'titleMedium' : 'headlineSmall'} style={{ color: theme.colors.primary }}>
            {formatCurrency(item.price_per_unit, item.unit)}
          </Text>

          {recommendationReason ? (
            <View
              className="rounded-md px-sm py-sm"
              style={{ backgroundColor: theme.colors.primaryContainer }}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer }}>
                {recommendationReason}
              </Text>
            </View>
          ) : null}

          {!compact && description ? (
            <Text
              numberOfLines={2}
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}>
              {description}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-sm">
            <Button mode="outlined" icon="phone-outline" onPress={onCallPress}>
              Call Farmer
            </Button>
            <Button mode="text" icon="directions" onPress={onDirectionsPress}>
              Directions
            </Button>
          </View>
        </View>
      </View>
    </Card>
  );
}

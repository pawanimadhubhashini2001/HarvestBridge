import { Image } from 'expo-image';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import type { OrderDto, OrderStatus } from '@/api/order.api';
import { useAppTheme } from '@/hooks/use-app-theme';

interface OrderCardProps {
  order: OrderDto;
  role: 'consumer' | 'farmer';
  onDirectionsPress?: () => void;
  onAcceptPress?: () => void;
  onRejectPress?: () => void;
  onCompletePress?: () => void;
  isUpdating?: boolean;
}

function formatCurrency(value: number | string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `LKR ${value}`;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not selected';
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

function formatStatus(status: OrderStatus) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getStatusColors(theme: ReturnType<typeof useAppTheme>, status: OrderStatus) {
  if (status === 'accepted') {
    return {
      backgroundColor: theme.colors.primaryContainer,
      textColor: theme.colors.primary,
    };
  }

  if (status === 'rejected') {
    return {
      backgroundColor: theme.colors.errorContainer,
      textColor: theme.colors.error,
    };
  }

  return {
    backgroundColor: theme.colors.surfaceVariant,
    textColor: theme.colors.onSurfaceVariant,
  };
}

export function OrderCard({
  order,
  role,
  onDirectionsPress,
  onAcceptPress,
  onRejectPress,
  onCompletePress,
  isUpdating = false,
}: OrderCardProps) {
  const theme = useAppTheme();
  const item = order.items[0];
  const product = item?.product;
  const quantityLabel = item
    ? `${item.quantity} ${product?.unit ?? ''}`.trim()
    : 'Quantity unavailable';
  const statusColors = getStatusColors(theme, order.order_status);
  const canShowDirections = role === 'consumer' && order.order_status === 'accepted';
  const canManage = role === 'farmer' && order.order_status === 'pending';
  const canComplete = role === 'farmer' && order.order_status === 'accepted';

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row items-start gap-md">
            <View
              className="items-center justify-center overflow-hidden rounded-md"
              style={{ width: 72, height: 72, backgroundColor: theme.colors.surfaceVariant }}>
              {product?.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No Image
                </Text>
              )}
            </View>

            <View className="flex-1 gap-xs">
              <View className="flex-row items-start justify-between gap-sm">
                <Text variant="titleMedium" style={{ flex: 1, fontWeight: '700' }}>
                  {product?.crop_name ?? 'Marketplace Product'}
                </Text>
                <Chip
                  compact
                  style={{ backgroundColor: statusColors.backgroundColor }}
                  textStyle={{ color: statusColors.textColor }}>
                  {formatStatus(order.order_status)}
                </Chip>
              </View>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {role === 'farmer'
                  ? `Consumer: ${order.consumer?.name ?? 'Consumer unavailable'}`
                  : order.store?.store_name ?? 'Store unavailable'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Visit date: {formatDate(order.visit_date)}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            <Chip compact>{quantityLabel}</Chip>
            <Chip compact>{formatCurrency(order.total_amount)}</Chip>
            {order.store?.district ? <Chip compact>{order.store.district}</Chip> : null}
          </View>

          {order.notes?.trim() ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Notes: {order.notes}
            </Text>
          ) : null}

          {role === 'farmer' ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Phone: {order.consumer?.phone ?? 'Not provided'}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-sm">
            {canShowDirections ? (
              <Button mode="contained" icon="map-marker-path" onPress={onDirectionsPress}>
                Directions
              </Button>
            ) : null}
            {role === 'consumer' && order.order_status === 'pending' ? (
              <Chip compact>Waiting for farmer approval</Chip>
            ) : null}
            {canManage ? (
              <>
                <Button mode="contained" loading={isUpdating} disabled={isUpdating} onPress={onAcceptPress}>
                  Accept
                </Button>
                <Button mode="outlined" loading={isUpdating} disabled={isUpdating} onPress={onRejectPress}>
                  Reject
                </Button>
              </>
            ) : null}
            {canComplete ? (
              <Button mode="contained-tonal" loading={isUpdating} disabled={isUpdating} onPress={onCompletePress}>
                Mark Completed
              </Button>
            ) : null}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

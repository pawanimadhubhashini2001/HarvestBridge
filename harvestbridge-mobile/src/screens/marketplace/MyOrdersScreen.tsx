import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Card, Chip, SegmentedButtons, Snackbar, Text } from 'react-native-paper';

import {
  getCompostRequests,
  getCompostRequestsQueryKey,
  type CompostRequestDto,
} from '@/api/compost-listing.api';
import {
  getDonationRequests,
  getDonationRequestsQueryKey,
  type DonationRequestDto,
} from '@/api/donation.api';
import { getMyOrders, getMyOrdersQueryKey, type OrderDto } from '@/api/order.api';
import {
  getPreOrderRequests,
  getPreOrderRequestsQueryKey,
  type PreOrderRequestDto,
} from '@/api/pre-order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

type RoleOrderDto = OrderDto | DonationRequestDto | CompostRequestDto;
type ConsumerOrdersTab = 'orders' | 'pre_orders';

export function MyOrdersScreen({ navigation }: AppTabScreenProps<'MyOrders'>) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ConsumerOrdersTab>('orders');
  const orderMode =
    user?.role === 'ngo'
      ? 'donations'
      : user?.role === 'compost_business'
        ? 'compost'
        : 'products';
  const ordersQuery = useQuery<RoleOrderDto[]>({
    queryKey:
      orderMode === 'donations'
        ? getDonationRequestsQueryKey()
        : orderMode === 'compost'
          ? getCompostRequestsQueryKey()
          : getMyOrdersQueryKey(),
    queryFn: () => {
      if (orderMode === 'donations') {
        return getDonationRequests();
      }

      if (orderMode === 'compost') {
        return getCompostRequests();
      }

      return getMyOrders();
    },
  });
  const preOrderRequestsQuery = useQuery({
    queryKey: getPreOrderRequestsQueryKey(),
    queryFn: getPreOrderRequests,
    enabled: user?.role === 'consumer',
  });

  async function openDirections(url?: string | null) {
    if (!url) {
      setFeedbackMessage('Directions are not available for this order.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setFeedbackMessage('Unable to open directions on this device.');
    }
  }

  const isConsumer = user?.role === 'consumer';
  const isPreOrdersTab = isConsumer && activeTab === 'pre_orders';

  if (!isPreOrdersTab && ordersQuery.isLoading && !ordersQuery.data) {
    return <LoadingState message="Loading your orders..." />;
  }

  if (isPreOrdersTab && preOrderRequestsQuery.isLoading && !preOrderRequestsQuery.data) {
    return <LoadingState message="Loading your pre-order requests..." />;
  }

  if (!isPreOrdersTab && ordersQuery.isError && !ordersQuery.data) {
    return (
      <ErrorState
        title="Unable to load orders"
        message={getErrorMessage(ordersQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void ordersQuery.refetch();
        }}
      />
    );
  }

  if (isPreOrdersTab && preOrderRequestsQuery.isError && !preOrderRequestsQuery.data) {
    return (
      <ErrorState
        title="Unable to load pre-order requests"
        message={getErrorMessage(preOrderRequestsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void preOrderRequestsQuery.refetch();
        }}
      />
    );
  }

  const orders: RoleOrderDto[] = ordersQuery.data ?? [];
  const preOrderRequests = preOrderRequestsQuery.data ?? [];
  const copy = getOrdersCopy(orderMode);
  const activeDescription = isPreOrdersTab
    ? 'Track pre-order requests before harvest.'
    : copy.description;

  return (
    <Screen
      scrollable
      contentClassName="gap-md"
      refreshing={isPreOrdersTab ? preOrderRequestsQuery.isRefetching : ordersQuery.isRefetching}
      onRefresh={() => {
        if (isPreOrdersTab) {
          void preOrderRequestsQuery.refetch();
          return;
        }

        void ordersQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-sm">
            <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
              {copy.title}
            </Text>
            {isConsumer ? (
              <SegmentedButtons
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ConsumerOrdersTab)}
                buttons={[
                  {
                    value: 'orders',
                    label: `Orders (${orders.length})`,
                  },
                  {
                    value: 'pre_orders',
                    label: `Pre-orders (${preOrderRequests.length})`,
                  },
                ]}
              />
            ) : null}
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {activeDescription}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {isPreOrdersTab ? (
        preOrderRequests.length === 0 ? (
          <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No pre-order requests yet.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="gap-md">
            {preOrderRequests.map((request) => (
              <PreOrderRequestCard
                key={request.id}
                request={request}
                onDirectionsPress={() => {
                  void openDirections(
                    request.actions?.open_maps_action?.url
                      ?? request.actions?.google_maps_url
                      ?? null,
                  );
                }}
              />
            ))}
          </View>
        )
      ) : orders.length === 0 ? (
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Card.Content>
            <View className="gap-md">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                No orders yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {copy.emptyMessage}
              </Text>
              <Button
                mode="contained"
                style={{ alignSelf: 'stretch' }}
                contentStyle={{ minHeight: 48 }}
                onPress={() => {
                  navigation.navigate('MainTabs', { screen: 'Marketplace' });
                }}>
                Browse Marketplace
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <View className="gap-md">
          {orders.map((order) => (
            orderMode === 'donations' ? (
              <DonationRequestCard
                key={order.id}
                request={order as DonationRequestDto}
                onDirectionsPress={() => {
                  const request = order as DonationRequestDto;

                  void openDirections(
                    request.actions?.open_maps_action?.url
                      ?? request.actions?.google_maps_url
                      ?? null,
                  );
                }}
              />
            ) : orderMode === 'compost' ? (
              <CompostRequestCard
                key={order.id}
                request={order as CompostRequestDto}
                onDirectionsPress={() => {
                  const request = order as CompostRequestDto;

                  void openDirections(
                    request.actions?.open_maps_action?.url
                      ?? request.actions?.google_maps_url
                      ?? null,
                  );
                }}
              />
            ) : (
              <OrderCard
                key={order.id}
                order={order as OrderDto}
                role="consumer"
                onDirectionsPress={() => {
                  const productOrder = order as OrderDto;

                  void openDirections(
                    productOrder.store?.open_maps_action?.url
                      ?? productOrder.store?.google_maps_url
                      ?? null,
                  );
                }}
              />
            )
          ))}
        </View>
      )}

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage}
      </Snackbar>
    </Screen>
  );
}

function getOrdersCopy(mode: 'products' | 'donations' | 'compost') {
  if (mode === 'donations') {
    return {
      title: 'My Donation Orders',
      description: 'Track donation requests sent to farmers.',
      emptyMessage: 'Order a donation from the donations marketplace to start tracking it here.',
    };
  }

  if (mode === 'compost') {
    return {
      title: 'My Compost Orders',
      description: 'Track compost requests sent to farmers.',
      emptyMessage: 'Order compost from the compost marketplace to start tracking it here.',
    };
  }

  return {
    title: 'My Orders',
    description: 'Track farmer approvals and open directions once a visit order is accepted.',
    emptyMessage: 'Place an order from the marketplace to reserve produce before visiting a farmer.',
  };
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

function formatStatus(status: string) {
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function DonationRequestCard({
  request,
  onDirectionsPress,
}: {
  request: DonationRequestDto;
  onDirectionsPress: () => void;
}) {
  const theme = useAppTheme();
  const canShowDirections =
    request.status === 'approved'
    && Boolean(request.actions?.open_maps_action?.url ?? request.actions?.google_maps_url);

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row items-start justify-between gap-sm">
            <View className="flex-1 gap-xs">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                Donation #{request.donation_id}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Requested: {formatDate(request.created_at)}
              </Text>
            </View>
            <Chip compact>{formatStatus(request.status)}</Chip>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            {request.quantity ? (
              <Chip compact>
                {request.quantity} {request.donation?.unit ?? ''}
              </Chip>
            ) : null}
            {request.donation?.store?.store_name ? (
              <Chip compact>{request.donation.store.store_name}</Chip>
            ) : null}
          </View>

          {request.message?.trim() ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Message: {request.message}
            </Text>
          ) : null}

          {canShowDirections ? (
            <Button
              mode="contained"
              icon="map-marker-path"
              contentStyle={{ minHeight: 44 }}
              onPress={onDirectionsPress}>
              Directions
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

function CompostRequestCard({
  request,
  onDirectionsPress,
}: {
  request: CompostRequestDto;
  onDirectionsPress: () => void;
}) {
  const theme = useAppTheme();
  const listing = request.compost_listing;
  const canShowDirections =
    request.status === 'approved'
    && Boolean(request.actions?.open_maps_action?.url ?? request.actions?.google_maps_url);

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row items-start justify-between gap-sm">
            <View className="flex-1 gap-xs">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {listing?.waste_type ?? `Compost #${request.compost_listing_id}`}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Pickup: {formatDate(request.pickup_date)} at {request.pickup_time}
              </Text>
            </View>
            <Chip compact>{formatStatus(request.status)}</Chip>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            {request.quantity ? <Chip compact>{request.quantity} {listing?.unit ?? ''}</Chip> : null}
            {listing?.store?.store_name ? <Chip compact>{listing.store.store_name}</Chip> : null}
          </View>

          {request.notes?.trim() ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Notes: {request.notes}
            </Text>
          ) : null}

          {canShowDirections ? (
            <Button
              mode="contained"
              icon="map-marker-path"
              contentStyle={{ minHeight: 44 }}
              onPress={onDirectionsPress}>
              Directions
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

function PreOrderRequestCard({
  request,
  onDirectionsPress,
}: {
  request: PreOrderRequestDto;
  onDirectionsPress: () => void;
}) {
  const theme = useAppTheme();
  const product = request.product;
  const canShowDirections =
    request.status === 'ready'
    && Boolean(request.actions?.open_maps_action?.url ?? request.actions?.google_maps_url);

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row items-start justify-between gap-sm">
            <View className="flex-1 gap-xs">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {product?.crop_name ?? 'Pre-order Product'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Expected harvest: {formatDate(product?.expected_harvest_date)}
              </Text>
            </View>
            <Chip compact>{formatStatus(request.status)}</Chip>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            <Chip compact>{request.quantity} {product?.unit ?? ''}</Chip>
            <Chip compact>LKR {request.subtotal}</Chip>
            {product?.store?.store_name ? <Chip compact>{product.store.store_name}</Chip> : null}
          </View>

          {request.status === 'accepted' ? (
            <Chip compact>Farmer accepted. Waiting for harvest readiness</Chip>
          ) : null}

          {request.notes?.trim() ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Notes: {request.notes}
            </Text>
          ) : null}

          {canShowDirections ? (
            <Button
              mode="contained"
              icon="map-marker-path"
              contentStyle={{ minHeight: 44 }}
              onPress={onDirectionsPress}>
              Directions
            </Button>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

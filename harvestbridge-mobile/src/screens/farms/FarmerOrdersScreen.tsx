import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, SegmentedButtons, Snackbar, Text } from 'react-native-paper';

import {
  getFarmerOrders,
  getFarmerOrdersQueryKey,
  type OrderStatus,
  updateOrderStatus,
} from '@/api/order.api';
import {
  getFarmerPreOrderRequests,
  getFarmerPreOrderRequestsQueryKey,
  getPreOrderProductsQueryKey,
  type PreOrderRequestDto,
  type PreOrderRequestStatus,
  updatePreOrderRequestStatus,
} from '@/api/pre-order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

type OrdersTab = 'orders' | 'pre_orders';

export function FarmerOrdersScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<OrdersTab>('orders');

  const ordersQuery = useQuery({
    queryKey: getFarmerOrdersQueryKey(),
    queryFn: getFarmerOrders,
  });

  const preOrderRequestsQuery = useQuery({
    queryKey: getFarmerPreOrderRequestsQueryKey(),
    queryFn: getFarmerPreOrderRequests,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: OrderStatus }) => {
      setUpdatingOrderId(orderId);
      return updateOrderStatus(orderId, status);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getFarmerOrdersQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
      ]);
      setFeedbackMessage(`Order ${variables.status}.`);
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    },
  });

  const preOrderStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: number;
      status: PreOrderRequestStatus;
    }) => {
      setUpdatingOrderId(requestId);
      return updatePreOrderRequestStatus(requestId, status);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getFarmerPreOrderRequestsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getPreOrderProductsQueryKey() }),
      ]);
      setFeedbackMessage(`Pre-order ${variables.status}.`);
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    },
  });

  function updateStatus(orderId: number, status: OrderStatus) {
    statusMutation.mutate({ orderId, status });
  }

  function updatePreOrderStatus(requestId: number, status: PreOrderRequestStatus) {
    preOrderStatusMutation.mutate({ requestId, status });
  }

  const orders = ordersQuery.data ?? [];
  const preOrderRequests = preOrderRequestsQuery.data ?? [];
  const isOrdersTab = activeTab === 'orders';
  const activeQuery = isOrdersTab ? ordersQuery : preOrderRequestsQuery;

  if (activeQuery.isLoading && !activeQuery.data) {
    return (
      <LoadingState
        message={isOrdersTab ? 'Loading customer orders...' : 'Loading pre-order requests...'}
      />
    );
  }

  if (activeQuery.isError && !activeQuery.data) {
    return (
      <ErrorState
        title={isOrdersTab ? 'Unable to load orders' : 'Unable to load pre-order requests'}
        message={getErrorMessage(activeQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void activeQuery.refetch();
        }}
      />
    );
  }

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={activeQuery.isRefetching}
      onRefresh={() => {
        void activeQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-sm">
            <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
              Farmer Orders
            </Text>
            <SegmentedButtons
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as OrdersTab)}
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
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {isOrdersTab
                ? 'Review customer product orders and update their status.'
                : 'Accept requests, mark harvest-ready produce, then complete pickup.'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {isOrdersTab ? (
        orders.length === 0 ? (
          <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No customer orders have arrived yet.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View className="gap-md">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                role="farmer"
                isUpdating={updatingOrderId === order.id}
                onAcceptPress={() => updateStatus(order.id, 'accepted')}
                onRejectPress={() => updateStatus(order.id, 'rejected')}
                onCompletePress={() => updateStatus(order.id, 'completed')}
              />
            ))}
          </View>
        )
      ) : preOrderRequests.length === 0 ? (
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No pre-order requests have arrived yet.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View className="gap-md">
          {preOrderRequests.map((request) => (
            <PreOrderRequestCard
              key={request.id}
              request={request}
              isUpdating={updatingOrderId === request.id}
              onAcceptPress={() => updatePreOrderStatus(request.id, 'accepted')}
              onRejectPress={() => updatePreOrderStatus(request.id, 'rejected')}
              onReadyPress={() => updatePreOrderStatus(request.id, 'ready')}
              onCompletePress={() => updatePreOrderStatus(request.id, 'completed')}
            />
          ))}
        </View>
      )}

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage}
      </Snackbar>
    </Screen>
  );
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

function PreOrderRequestCard({
  request,
  isUpdating,
  onAcceptPress,
  onRejectPress,
  onReadyPress,
  onCompletePress,
}: {
  request: PreOrderRequestDto;
  isUpdating: boolean;
  onAcceptPress: () => void;
  onRejectPress: () => void;
  onReadyPress: () => void;
  onCompletePress: () => void;
}) {
  const theme = useAppTheme();
  const product = request.product;
  const canManage = request.status === 'pending';
  const canMarkReady = request.status === 'accepted';
  const canComplete = request.status === 'ready';

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
                Consumer: {request.consumer?.name ?? 'Consumer unavailable'}
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
            {product?.store?.district ? <Chip compact>{product.store.district}</Chip> : null}
          </View>

          {request.notes?.trim() ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Notes: {request.notes}
            </Text>
          ) : null}

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Phone: {request.consumer?.phone ?? 'Not provided'}
          </Text>

          <View className="flex-row flex-wrap gap-sm">
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
            {canMarkReady ? (
              <Button mode="contained-tonal" loading={isUpdating} disabled={isUpdating} onPress={onReadyPress}>
                Mark Ready
              </Button>
            ) : null}
            {canComplete ? (
              <Button mode="contained-tonal" loading={isUpdating} disabled={isUpdating} onPress={onCompletePress}>
                Complete
              </Button>
            ) : null}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

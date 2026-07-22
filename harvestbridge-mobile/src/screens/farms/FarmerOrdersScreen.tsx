import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Card, Snackbar, Text } from 'react-native-paper';

import {
  getFarmerOrders,
  getFarmerOrdersQueryKey,
  type OrderStatus,
  updateOrderStatus,
} from '@/api/order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

export function FarmerOrdersScreen() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: getFarmerOrdersQueryKey(),
    queryFn: getFarmerOrders,
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

  function updateStatus(orderId: number, status: OrderStatus) {
    statusMutation.mutate({ orderId, status });
  }

  if (ordersQuery.isLoading && !ordersQuery.data) {
    return <LoadingState message="Loading customer orders..." />;
  }

  if (ordersQuery.isError && !ordersQuery.data) {
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

  const orders = ordersQuery.data ?? [];

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={ordersQuery.isRefetching}
      onRefresh={() => {
        void ordersQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-sm">
            <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
              Customer Orders
            </Text>
          </View>
        </Card.Content>
      </Card>

      {orders.length === 0 ? (
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
      )}

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage}
      </Snackbar>
    </Screen>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Card, Snackbar, Text } from 'react-native-paper';

import { getMyOrders, getMyOrdersQueryKey } from '@/api/order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { OrderCard } from '@/components/marketplace/OrderCard';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

export function MyOrdersScreen({ navigation }: AppTabScreenProps<'MyOrders'>) {
  const theme = useAppTheme();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const ordersQuery = useQuery({
    queryKey: getMyOrdersQueryKey(),
    queryFn: getMyOrders,
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

  if (ordersQuery.isLoading && !ordersQuery.data) {
    return <LoadingState message="Loading your orders..." />;
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
              My Orders
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Track farmer approvals and open directions once a visit order is accepted.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {orders.length === 0 ? (
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Card.Content>
            <View className="gap-md">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                No orders yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Place an order from the marketplace to reserve produce before visiting a farmer.
              </Text>
              <Button
                mode="contained"
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
            <OrderCard
              key={order.id}
              order={order}
              role="consumer"
              onDirectionsPress={() => {
                void openDirections(
                  order.store?.open_maps_action?.url ?? order.store?.google_maps_url ?? null,
                );
              }}
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

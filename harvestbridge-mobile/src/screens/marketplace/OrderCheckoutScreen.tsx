import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';

import { getMarketplaceProduct, getMarketplaceProductQueryKey } from '@/api/marketplace.api';
import { createOrder, getMyOrdersQueryKey } from '@/api/order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function getTomorrowDateInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().slice(0, 10);
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

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function OrderCheckoutScreen({
  navigation,
  route,
}: AppStackScreenProps<'OrderCheckout'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const listingId = route.params?.listingId;
  const [quantity, setQuantity] = useState('');
  const [visitDate, setVisitDate] = useState(getTomorrowDateInput());
  const [notes, setNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing'),
    queryFn: () => getMarketplaceProduct(listingId ?? ''),
    enabled: Boolean(listingId),
  });

  const product = detailsQuery.data?.product;
  const store = detailsQuery.data?.store;
  const availableQuantity = Number(product?.available_quantity ?? 0);
  const selectedQuantity = Number(quantity);
  const subtotal = Number.isFinite(selectedQuantity) && product
    ? selectedQuantity * Number(product.price_per_unit)
    : 0;

  const quantityError = useMemo(() => {
    if (!quantity.trim()) {
      return 'Enter the quantity you want to reserve.';
    }

    if (!Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
      return 'Quantity must be greater than zero.';
    }

    if (selectedQuantity > availableQuantity) {
      return `Only ${availableQuantity} ${product?.unit ?? ''} is available.`.trim();
    }

    return null;
  }, [availableQuantity, product?.unit, quantity, selectedQuantity]);

  const visitDateError = useMemo(() => {
    if (!isValidDateInput(visitDate)) {
      return 'Use the date format YYYY-MM-DD.';
    }

    const selectedDate = new Date(`${visitDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return 'Visit date cannot be in the past.';
    }

    return null;
  }, [visitDate]);

  const orderMutation = useMutation({
    mutationFn: () => {
      if (!listingId) {
        throw new Error('The selected marketplace product could not be identified.');
      }

      if (quantityError || visitDateError) {
        throw new Error(quantityError ?? visitDateError ?? 'Check your order details.');
      }

      return createOrder({
        harvest_listing_id: listingId,
        quantity: selectedQuantity,
        visit_date: visitDate,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
        queryClient.invalidateQueries({
          queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing'),
        }),
      ]);
      navigation.replace('MainTabs', { screen: 'MyOrders' });
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  if (!listingId) {
    return (
      <ErrorState
        title="Product not found"
        message="The selected marketplace product could not be identified."
      />
    );
  }

  if (detailsQuery.isLoading && !detailsQuery.data) {
    return <LoadingState message="Loading order details..." />;
  }

  if (detailsQuery.isError && !detailsQuery.data) {
    return (
      <ErrorState
        title="Unable to load product"
        message={getErrorMessage(detailsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void detailsQuery.refetch();
        }}
      />
    );
  }

  if (!product) {
    return (
      <ErrorState
        title="Product unavailable"
        message="This marketplace product is not available right now."
      />
    );
  }

  const hasFormError = Boolean(quantityError || visitDateError);

  return (
    <Screen scrollable contentClassName="gap-md">
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-md">
            <View className="gap-xs">
              <Chip compact style={{ alignSelf: 'flex-start' }}>
                Store Visit Order
              </Chip>
              <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                {product.crop_name ?? 'Marketplace Product'}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {store?.store_name ?? 'Store unavailable'}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{product.available_quantity} {product.unit} available</Chip>
              <Chip compact>{formatCurrency(product.price_per_unit)} / {product.unit}</Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Card.Content>
          <View className="gap-md">
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              Reserve before visiting
            </Text>

            <View>
              <TextInput
                label={`Quantity (${product.unit})`}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                mode="outlined"
              />
              <HelperText type="error" visible={Boolean(quantityError)}>
                {quantityError}
              </HelperText>
            </View>

            <View>
              <TextInput
                label="Visit date"
                value={visitDate}
                onChangeText={setVisitDate}
                placeholder="YYYY-MM-DD"
                mode="outlined"
              />
              <HelperText type="error" visible={Boolean(visitDateError)}>
                {visitDateError}
              </HelperText>
            </View>

            <TextInput
              label="Notes for farmer"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View
              className="rounded-md px-md py-md"
              style={{ backgroundColor: theme.colors.primaryContainer }}>
              <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                Estimated total: {formatCurrency(subtotal)}
              </Text>
            </View>

            <Button
              mode="contained"
              loading={orderMutation.isPending}
              disabled={orderMutation.isPending || hasFormError}
              style={{ alignSelf: 'stretch' }}
              contentStyle={{ minHeight: 48 }}
              onPress={() => {
                orderMutation.mutate();
              }}>
              Send Order Request
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage}
      </Snackbar>
    </Screen>
  );
}

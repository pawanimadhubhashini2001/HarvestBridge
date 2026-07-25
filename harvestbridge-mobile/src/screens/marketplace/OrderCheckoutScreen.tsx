import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';

import {
  createCompostRequest,
  getCompostRequestsQueryKey,
} from '@/api/compost-listing.api';
import {
  createDonationRequest,
  getDonationRequestsQueryKey,
} from '@/api/donation.api';
import { getMarketplaceProduct, getMarketplaceProductQueryKey } from '@/api/marketplace.api';
import { createOrder, getMyOrdersQueryKey } from '@/api/order.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
  const listingId = route.params?.listingId;
  const listingType = route.params?.listingType ?? 'product';
  const isProductOrder = listingType === 'product';
  const isDonationOrder = listingType === 'donation';
  const isCompostOrder = listingType === 'compost';
  const [quantity, setQuantity] = useState('');
  const [visitDate, setVisitDate] = useState(getTomorrowDateInput());
  const [pickupTime, setPickupTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const detailsQuery = useQuery({
    queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing'),
    queryFn: () => getMarketplaceProduct(listingId ?? ''),
    enabled: Boolean(listingId) && isProductOrder,
  });

  const product = detailsQuery.data?.product;
  const store = detailsQuery.data?.store;
  const listingTitle =
    product?.crop_name
    ?? route.params?.title
    ?? (isDonationOrder ? 'Farmer Donation' : isCompostOrder ? 'Compost Material' : 'Marketplace Product');
  const storeName = store?.store_name ?? route.params?.storeName ?? 'Store unavailable';
  const listingUnit = product?.unit ?? route.params?.unit ?? '';
  const listingAvailableQuantity = product?.available_quantity ?? route.params?.availableQuantity ?? '0';
  const listingPricePerUnit = product?.price_per_unit ?? route.params?.pricePerUnit ?? '0';
  const availableQuantity = Number(listingAvailableQuantity);
  const selectedQuantity = Number(quantity);
  const unitPrice = Number(listingPricePerUnit);
  const shouldShowEstimatedTotal = Number.isFinite(unitPrice) && unitPrice > 0;
  const subtotal = Number.isFinite(selectedQuantity) && shouldShowEstimatedTotal
    ? selectedQuantity * unitPrice
    : 0;

  const quantityError = useMemo(() => {
    if (!quantity.trim()) {
      return isProductOrder
        ? 'Enter the quantity you want to reserve.'
        : 'Enter the quantity you want to request.';
    }

    if (!Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
      return 'Quantity must be greater than zero.';
    }

    if (selectedQuantity > availableQuantity) {
      return `Only ${availableQuantity} ${listingUnit} is available.`.trim();
    }

    return null;
  }, [availableQuantity, isProductOrder, listingUnit, quantity, selectedQuantity]);

  const visitDateError = useMemo(() => {
    if (isDonationOrder) {
      return null;
    }

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
  }, [isDonationOrder, visitDate]);

  const pickupTimeError = useMemo(() => {
    if (!isCompostOrder) {
      return null;
    }

    if (!pickupTime.trim()) {
      return 'Enter a pickup time.';
    }

    return null;
  }, [isCompostOrder, pickupTime]);

  const orderMutation = useMutation<unknown, Error>({
    mutationFn: () => {
      if (!listingId) {
        throw new Error('The selected listing could not be identified.');
      }

      if (quantityError || visitDateError || pickupTimeError) {
        throw new Error(
          quantityError ?? visitDateError ?? pickupTimeError ?? 'Check your order details.',
        );
      }

      if (isDonationOrder) {
        return createDonationRequest({
          donation_id: Number(listingId),
          quantity: selectedQuantity,
          message: notes.trim() || undefined,
        });
      }

      if (isCompostOrder) {
        return createCompostRequest({
          compost_listing_id: Number(listingId),
          quantity: selectedQuantity,
          pickup_date: visitDate,
          pickup_time: pickupTime.trim(),
          notes: notes.trim() || undefined,
        });
      }

      return createOrder({
        harvest_listing_id: listingId,
        quantity: selectedQuantity,
        visit_date: visitDate,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: ['role-marketplace'] }),
      ];

      if (isDonationOrder) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: getDonationRequestsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ['available-donations'] }),
        );
      } else if (isCompostOrder) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: getCompostRequestsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ['available-compost'] }),
        );
      } else {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
          queryClient.invalidateQueries({
            queryKey: getMarketplaceProductQueryKey(listingId ?? 'missing'),
          }),
        );
      }

      await Promise.all(invalidations);
      navigation.replace('MainTabs', { screen: 'MyOrders' });
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  if (!listingId) {
    return (
      <ErrorState
        title="Listing not found"
        message="The selected listing could not be identified."
      />
    );
  }

  if (isProductOrder && detailsQuery.isLoading && !detailsQuery.data) {
    return <LoadingState message="Loading order details..." />;
  }

  if (isProductOrder && detailsQuery.isError && !detailsQuery.data) {
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

  if (isProductOrder && !product) {
    return (
      <ErrorState
        title="Product unavailable"
        message="This marketplace product is not available right now."
      />
    );
  }

  const hasFormError = Boolean(quantityError || visitDateError || pickupTimeError);
  const canSubmitForRole =
    (isProductOrder && user?.role === 'consumer')
    || (isDonationOrder && user?.role === 'ngo')
    || (isCompostOrder && user?.role === 'compost_business');
  const orderHeading = isDonationOrder
    ? 'Request donation before visiting'
    : isCompostOrder
      ? 'Request compost pickup'
      : 'Reserve before visiting';
  const submitLabel = isDonationOrder
    ? 'Send Donation Request'
    : isCompostOrder
      ? 'Send Compost Request'
      : 'Send Order Request';

  return (
    <Screen scrollable contentClassName="gap-md">
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-md">
            <View className="gap-xs">
              <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                {listingTitle}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {storeName}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{listingAvailableQuantity} {listingUnit} available</Chip>
              {isProductOrder || Number(listingPricePerUnit) > 0 ? (
                <Chip compact>{formatCurrency(listingPricePerUnit)} / {listingUnit}</Chip>
              ) : (
                <Chip compact>{isDonationOrder ? 'Donation' : 'Free compost'}</Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Card.Content>
          <View className="gap-md">
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              {orderHeading}
            </Text>

            <View>
              <TextInput
                label={`Quantity (${listingUnit})`}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                mode="outlined"
              />
              <HelperText type="error" visible={Boolean(quantityError)}>
                {quantityError}
              </HelperText>
            </View>

            {!isDonationOrder ? (
              <View>
                <TextInput
                  label={isCompostOrder ? 'Pickup date' : 'Visit date'}
                  value={visitDate}
                  onChangeText={setVisitDate}
                  placeholder="YYYY-MM-DD"
                  mode="outlined"
                />
                <HelperText type="error" visible={Boolean(visitDateError)}>
                  {visitDateError}
                </HelperText>
              </View>
            ) : null}

            {isCompostOrder ? (
              <View>
                <TextInput
                  label="Pickup time"
                  value={pickupTime}
                  onChangeText={setPickupTime}
                  placeholder="09:00"
                  mode="outlined"
                />
                <HelperText type="error" visible={Boolean(pickupTimeError)}>
                  {pickupTimeError}
                </HelperText>
              </View>
            ) : null}

            <TextInput
              label={isDonationOrder ? 'Message for farmer' : 'Notes for farmer'}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            {shouldShowEstimatedTotal ? (
              <View
                className="rounded-md px-md py-md"
                style={{ backgroundColor: theme.colors.primaryContainer }}>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                  Estimated total: {formatCurrency(subtotal)}
                </Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              loading={orderMutation.isPending}
              disabled={orderMutation.isPending || hasFormError || !canSubmitForRole}
              style={{ alignSelf: 'stretch' }}
              contentStyle={{ minHeight: 48 }}
              onPress={() => {
                orderMutation.mutate();
              }}>
              {submitLabel}
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

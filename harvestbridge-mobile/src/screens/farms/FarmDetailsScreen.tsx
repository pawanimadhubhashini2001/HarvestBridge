import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Dialog,
  HelperText,
  IconButton,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

import {
  deleteCompostListing,
  getCompostListings,
  getCompostListingsQueryKey,
  type CompostListingDto,
} from '@/api/compost-listing.api';
import {
  deleteDonation,
  getDonations,
  getDonationsQueryKey,
  type DonationDto,
} from '@/api/donation.api';
import {
  deleteHarvestListing,
  getHarvestListings,
  getHarvestListingsQueryKey,
  updateHarvestListingAvailability,
  type HarvestListingDto,
} from '@/api/harvest-listing.api';
import {
  getMyStore,
  getMyStoreQueryKey,
  getStoreDetailsQueryKey,
} from '@/api/store.api';
import { FarmerProductCard } from '@/components/store/FarmerProductCard';
import { HarvestListingGalleryManager } from '@/components/store/HarvestListingGalleryManager';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatStoreStatus } from '@/utils/store-status';

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      className="flex-1 gap-xs rounded-2xl px-md py-md"
      style={{
        minWidth: 140,
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurface, fontWeight: '700', lineHeight: 24 }}
      >
        {value}
      </Text>
    </View>
  );
}

function ListingEmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      className="gap-sm rounded-2xl border px-lg py-lg"
      style={{ borderColor: theme.colors.outlineVariant ?? theme.colors.outline }}
    >
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
      >
        {message}
      </Text>
      <Button
        mode="contained"
        icon="plus"
        onPress={onAction}
        style={{ alignSelf: 'flex-start' }}
      >
        {actionLabel}
      </Button>
    </View>
  );
}

function formatMoney(value?: number | string | null, unit?: string | null) {
  if (value === null || value === undefined || value === '') {
    return 'No price added';
  }

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

function formatShortDate(value?: string | null) {
  if (!value) {
    return 'Not set';
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

function StoreListingManagementCard({
  title,
  subtitle,
  status,
  quantity,
  unit,
  price,
  dateLabel,
  dateValue,
  imageUrl,
  description,
  onEdit,
  onDelete,
  onManageGallery,
  busy = false,
}: {
  title: string;
  subtitle?: string | null;
  status: string;
  quantity: number | string;
  unit: string;
  price?: number | string | null;
  dateLabel: string;
  dateValue?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onManageGallery?: () => void;
  busy?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row gap-md">
            <View
              className="items-center justify-center overflow-hidden rounded-lg"
              style={{
                width: 88,
                height: 88,
                backgroundColor: theme.colors.surfaceVariant,
              }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No Image
                </Text>
              )}
            </View>

            <View className="flex-1 gap-sm">
              <View className="gap-xs">
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <View className="flex-row flex-wrap gap-sm">
                <Chip compact>{status}</Chip>
                <Chip compact>
                  {quantity} {unit} available
                </Chip>
              </View>

              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {formatMoney(price, unit)}
              </Text>
            </View>
          </View>

          <View className="gap-xs">
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {dateLabel}: {formatShortDate(dateValue)}
            </Text>
            {description ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {description}
              </Text>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-sm">
            <Button mode="outlined" onPress={onEdit} disabled={busy}>
              Edit
            </Button>
            {onManageGallery ? (
              <Button mode="outlined" onPress={onManageGallery} disabled={busy}>
                Manage Gallery
              </Button>
            ) : null}
            <Button mode="outlined" textColor="#B42318" onPress={onDelete} disabled={busy}>
              Delete
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export function FarmDetailsScreen({ navigation }: AppStackScreenProps<'FarmDetails'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<HarvestListingDto | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<DonationDto | null>(null);
  const [selectedCompostListing, setSelectedCompostListing] = useState<CompostListingDto | null>(null);
  const [galleryListingId, setGalleryListingId] = useState<number | null>(null);
  const [quantityDialogVisible, setQuantityDialogVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteDonationDialogVisible, setDeleteDonationDialogVisible] = useState(false);
  const [deleteCompostDialogVisible, setDeleteCompostDialogVisible] = useState(false);
  const [availableQuantityInput, setAvailableQuantityInput] = useState('');
  const [availableQuantityError, setAvailableQuantityError] = useState<string | null>(null);

  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });

  const store = storeQuery.data;
  const storeId = store?.id;

  const harvestListingsQuery = useQuery({
    queryKey: getHarvestListingsQueryKey(),
    queryFn: getHarvestListings,
    enabled: Boolean(storeId),
  });

  const donationsQuery = useQuery({
    queryKey: getDonationsQueryKey(),
    queryFn: getDonations,
    enabled: Boolean(storeId),
  });

  const compostListingsQuery = useQuery({
    queryKey: getCompostListingsQueryKey(),
    queryFn: getCompostListings,
    enabled: Boolean(storeId),
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({
      listingId,
      payload,
    }: {
      listingId: number;
      payload: {
        status?: 'available' | 'hidden' | 'sold_out';
        available_quantity?: number;
      };
    }) => updateHarvestListingAvailability(listingId, payload),
    onSuccess: async (updatedListing) => {
      queryClient.setQueryData<HarvestListingDto[]>(
        getHarvestListingsQueryKey(),
        (currentListings) =>
          currentListings?.map((listing) =>
            listing.id === updatedListing.id ? updatedListing : listing,
          ) ?? [updatedListing],
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getHarvestListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        storeId
          ? queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) })
          : Promise.resolve(),
      ]);

      setQuantityDialogVisible(false);
      setStatusDialogVisible(false);
      setSelectedListing(updatedListing);
      setFeedbackMessage('Product availability updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const deleteHarvestListingMutation = useMutation({
    mutationFn: async (listingId: number) => deleteHarvestListing(listingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getHarvestListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        storeId
          ? queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) })
          : Promise.resolve(),
      ]);

      setDeleteDialogVisible(false);
      setSelectedListing(null);
      setFeedbackMessage('Product deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const deleteDonationMutation = useMutation({
    mutationFn: async (donationId: number) => deleteDonation(donationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getDonationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        storeId
          ? queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) })
          : Promise.resolve(),
      ]);

      setDeleteDonationDialogVisible(false);
      setSelectedDonation(null);
      setFeedbackMessage('Donation deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const deleteCompostListingMutation = useMutation({
    mutationFn: async (listingId: number) => deleteCompostListing(listingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getCompostListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        storeId
          ? queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) })
          : Promise.resolve(),
      ]);

      setDeleteCompostDialogVisible(false);
      setSelectedCompostListing(null);
      setFeedbackMessage('Compost listing deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Loading your store profile..." />;
  }

  if (storeQuery.isError && storeQuery.data === undefined) {
    return (
      <ErrorState
        title="Unable to load your store"
        message={getErrorMessage(storeQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void storeQuery.refetch();
        }}
      />
    );
  }

  if (!storeQuery.data) {
    return (
      <ErrorState
        title="No store profile yet"
        message="Create your store profile before publishing harvest listings."
        actionLabel="Create Store"
        onAction={() => {
          navigation.replace('AddFarm');
        }}
      />
    );
  }

  const currentStoreStatus = store.business_status ?? 'open';
  const harvestListings = harvestListingsQuery.data ?? [];
  const donations = donationsQuery.data ?? [];
  const compostListings = compostListingsQuery.data ?? [];
  const galleryListing =
    harvestListings.find((listing) => listing.id === galleryListingId) ?? null;
  const storeDescription =
    store.store_description?.trim()
    || 'Add a short description so customers understand what your store offers.';

  function openEditDialog(listing: HarvestListingDto) {
    setSelectedListing(listing);
    setAvailableQuantityInput(String(listing.available_quantity));
    setAvailableQuantityError(null);
    setQuantityDialogVisible(true);
  }

  function openStatusDialog(listing: HarvestListingDto) {
    setSelectedListing(listing);
    setStatusDialogVisible(true);
  }

  function openDeleteDialog(listing: HarvestListingDto) {
    setSelectedListing(listing);
    setDeleteDialogVisible(true);
  }

  async function handleQuantitySave() {
    if (!selectedListing) {
      return;
    }

    const parsedQuantity = Number(availableQuantityInput);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setAvailableQuantityError('Available quantity must be a number greater than or equal to zero.');
      return;
    }

    setAvailableQuantityError(null);
    await updateAvailabilityMutation.mutateAsync({
      listingId: selectedListing.id,
      payload: {
        available_quantity: parsedQuantity,
      },
    });
  }

  async function handleStatusChange(status: 'available' | 'hidden' | 'sold_out') {
    if (!selectedListing) {
      return;
    }

    await updateAvailabilityMutation.mutateAsync({
      listingId: selectedListing.id,
      payload: {
        status,
      },
    });
  }

  async function handleHideToggle(listing: HarvestListingDto) {
    await updateAvailabilityMutation.mutateAsync({
      listingId: listing.id,
      payload: {
        status: listing.status === 'hidden' ? 'available' : 'hidden',
      },
    });
  }

  function handleAddListing(listingType: 'product' | 'donation' | 'compost') {
    navigation.navigate('AddHarvestListing', { listingType });
  }

  return (
    <Screen scrollable contentClassName="gap-lg">
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-lg">
            <View className="flex-row items-start justify-between gap-md">
              <View className="flex-1 gap-sm">
                <View className="flex-row flex-wrap items-center gap-sm">
                  <Chip
                    compact
                    style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                    textStyle={{ color: theme.colors.primary }}
                  >
                    Store Profile
                  </Chip>
                  <Chip compact icon="storefront-outline">
                    {formatStoreStatus(currentStoreStatus)}
                  </Chip>
                </View>
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '700', lineHeight: 38 }}
                >
                  {store.store_name}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
                >
                  {storeDescription}
                </Text>
              </View>

              <IconButton
                icon="pencil-outline"
                mode="contained-tonal"
                size={20}
                onPress={() => {
                  navigation.navigate('EditFarm', { farmId: String(store.id) });
                }}
                accessibilityLabel="Edit store profile"
              />
            </View>

            <View className="flex-row items-center gap-md">
              <View
                className="items-center justify-center overflow-hidden rounded-3xl"
                style={{
                  width: 88,
                  height: 88,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                {store.store_logo_url ?? store.logo_url ?? store.store_image_url ? (
                  <Image
                    source={{
                      uri: store.store_logo_url ?? store.logo_url ?? store.store_image_url ?? '',
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    No Logo
                  </Text>
                )}
              </View>

              <View className="flex-1 gap-sm">
                <SummaryTile label="Phone" value={store.phone_number || 'Not added'} />
              </View>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <Chip compact icon="map-marker-outline">
                {store.district}
              </Chip>
              <Chip compact icon="sprout-outline">
                {store.active_crop_count ?? 0} active crops
              </Chip>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <SummaryTile label="Address" value={store.address || 'Not added'} />
              <SummaryTile label="Updated" value={store.updated_at ? new Date(store.updated_at).toLocaleDateString() : 'Not available'} />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="gap-sm">
              <View className="flex-row items-center justify-between gap-md">
                <View className="flex-1 gap-xs">
                  <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    My Products
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Manage listing visibility, stock, gallery images, and selling status from one place.
                  </Text>
                </View>
                <Button
                  mode="contained-tonal"
                  compact
                  icon="plus"
                  onPress={() => {
                    handleAddListing('product');
                  }}
                >
                  Add Product
                </Button>
              </View>
            </View>

            {harvestListingsQuery.isLoading && harvestListings.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading your products...
              </Text>
            ) : harvestListingsQuery.isError && harvestListings.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {getErrorMessage(harvestListingsQuery.error)}
              </Text>
            ) : harvestListings.length === 0 ? (
              <ListingEmptyState
                title="No products yet"
                message="Add marketplace products for customers who want to buy directly from your store."
                actionLabel="Add Product"
                onAction={() => {
                  handleAddListing('product');
                }}
              />
            ) : (
              <View className="gap-md">
                {harvestListings.map((listing) => (
                  <FarmerProductCard
                    key={listing.id}
                    item={listing}
                    busy={updateAvailabilityMutation.isPending || deleteHarvestListingMutation.isPending}
                    onEdit={() => {
                      openEditDialog(listing);
                    }}
                    onChangeStatus={() => {
                      openStatusDialog(listing);
                    }}
                    onHideToggle={() => {
                      void handleHideToggle(listing);
                    }}
                    onManageGallery={() => {
                      setGalleryListingId((currentId) =>
                        currentId === listing.id ? null : listing.id,
                      );
                    }}
                    onDelete={() => {
                      openDeleteDialog(listing);
                    }}
                  />
                ))}
              </View>
            )}

            {galleryListing ? <HarvestListingGalleryManager listing={galleryListing} /> : null}
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="gap-sm">
              <View className="flex-row items-center justify-between gap-md">
                <View className="flex-1 gap-xs">
                  <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    My Donations
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Review donation items available for NGOs and community collection.
                  </Text>
                </View>
                <Button
                  mode="contained-tonal"
                  compact
                  icon="plus"
                  onPress={() => {
                    handleAddListing('donation');
                  }}
                >
                  Add Donation
                </Button>
              </View>
            </View>

            {donationsQuery.isLoading && donations.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading your donations...
              </Text>
            ) : donationsQuery.isError && donations.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {getErrorMessage(donationsQuery.error)}
              </Text>
            ) : donations.length === 0 ? (
              <ListingEmptyState
                title="No donations yet"
                message="Share excess produce with NGOs without adding a selling price."
                actionLabel="Add Donation"
                onAction={() => {
                  handleAddListing('donation');
                }}
              />
            ) : (
              <View className="gap-md">
                {donations.map((donation: DonationDto) => (
                  <StoreListingManagementCard
                    key={donation.id}
                    title={donation.product?.crop_name ?? donation.crop_name ?? 'Donation'}
                    subtitle={donation.product?.crop_category ?? donation.crop_category ?? 'Donation listing'}
                    status={donation.collection_status ?? donation.status}
                    quantity={donation.quantity}
                    unit={donation.unit}
                    price={donation.price_per_unit}
                    dateLabel="Available Until"
                    dateValue={donation.available_until}
                    imageUrl={donation.primary_image?.url ?? donation.images?.[0]?.url ?? null}
                    description={donation.description ?? donation.notes ?? null}
                    busy={deleteDonationMutation.isPending}
                    onEdit={() => {
                      setFeedbackMessage('Donation editing is prepared for the next form update.');
                    }}
                    onManageGallery={() => {
                      setFeedbackMessage('Donation gallery management is prepared for the next form update.');
                    }}
                    onDelete={() => {
                      setSelectedDonation(donation);
                      setDeleteDonationDialogVisible(true);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="gap-sm">
              <View className="flex-row items-center justify-between gap-md">
                <View className="flex-1 gap-xs">
                  <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    My Compost
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Review compost items available for pickup and recycling collection.
                  </Text>
                </View>
                <Button
                  mode="contained-tonal"
                  compact
                  icon="plus"
                  onPress={() => {
                    handleAddListing('compost');
                  }}
                >
                  Add Compost
                </Button>
              </View>
            </View>

            {compostListingsQuery.isLoading && compostListings.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading your compost listings...
              </Text>
            ) : compostListingsQuery.isError && compostListings.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {getErrorMessage(compostListingsQuery.error)}
              </Text>
            ) : compostListings.length === 0 ? (
              <ListingEmptyState
                title="No compost listings yet"
                message="Share crop waste or compost materials without setting a selling price."
                actionLabel="Add Compost"
                onAction={() => {
                  handleAddListing('compost');
                }}
              />
            ) : (
              <View className="gap-md">
                {compostListings.map((listing: CompostListingDto) => (
                  <StoreListingManagementCard
                    key={listing.id}
                    title={listing.waste_type}
                    subtitle={listing.crop_category ?? 'Compost material'}
                    status={listing.collection_status ?? listing.status}
                    quantity={listing.quantity}
                    unit={listing.unit}
                    price={listing.price_per_unit}
                    dateLabel="Available Until"
                    dateValue={listing.available_until}
                    imageUrl={listing.primary_image?.url ?? listing.images?.[0]?.url ?? null}
                    description={listing.description ?? listing.notes ?? null}
                    busy={deleteCompostListingMutation.isPending}
                    onEdit={() => {
                      setFeedbackMessage('Compost editing is prepared for the next form update.');
                    }}
                    onManageGallery={() => {
                      setFeedbackMessage('Compost gallery management is prepared for the next form update.');
                    }}
                    onDelete={() => {
                      setSelectedCompostListing(listing);
                      setDeleteCompostDialogVisible(true);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => {
          setFeedbackMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setFeedbackMessage(null);
          },
        }}
      >
        {feedbackMessage ?? ''}
      </Snackbar>

      <Portal>
        <Dialog
          visible={quantityDialogVisible}
          onDismiss={() => {
            if (!updateAvailabilityMutation.isPending) {
              setQuantityDialogVisible(false);
              setAvailableQuantityError(null);
            }
          }}
        >
          <Dialog.Title>Edit Available Quantity</Dialog.Title>
          <Dialog.Content>
            <View className="gap-sm">
              <Text variant="bodyMedium">
                Update the current available stock for {selectedListing?.crop ?? 'this product'}.
              </Text>
              <TextInput
                mode="outlined"
                label="Available Quantity"
                value={availableQuantityInput}
                onChangeText={setAvailableQuantityInput}
                keyboardType="decimal-pad"
                disabled={updateAvailabilityMutation.isPending}
              />
              <HelperText type="error" visible={Boolean(availableQuantityError)}>
                {availableQuantityError ?? ''}
              </HelperText>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setQuantityDialogVisible(false);
                setAvailableQuantityError(null);
              }}
              disabled={updateAvailabilityMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                void handleQuantitySave();
              }}
              loading={updateAvailabilityMutation.isPending}
              disabled={updateAvailabilityMutation.isPending}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={statusDialogVisible}
          onDismiss={() => {
            if (!updateAvailabilityMutation.isPending) {
              setStatusDialogVisible(false);
            }
          }}
        >
          <Dialog.Title>Change Product Status</Dialog.Title>
          <Dialog.Content>
            <View className="gap-sm">
              <Text variant="bodyMedium">
                Choose the customer-facing availability status for {selectedListing?.crop ?? 'this product'}.
              </Text>
              <View className="flex-row flex-wrap gap-sm">
                <Button
                  mode="outlined"
                  disabled={updateAvailabilityMutation.isPending}
                  onPress={() => {
                    void handleStatusChange('available');
                  }}
                >
                  Available
                </Button>
                <Button
                  mode="outlined"
                  disabled={updateAvailabilityMutation.isPending}
                  onPress={() => {
                    void handleStatusChange('hidden');
                  }}
                >
                  Hidden
                </Button>
                <Button
                  mode="outlined"
                  disabled={updateAvailabilityMutation.isPending}
                  onPress={() => {
                    void handleStatusChange('sold_out');
                  }}
                >
                  Sold Out
                </Button>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setStatusDialogVisible(false);
              }}
              disabled={updateAvailabilityMutation.isPending}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Product?"
        message="This will permanently remove the selected harvest listing from your store."
        confirmLabel="Delete Product"
        cancelLabel="Cancel"
        loading={deleteHarvestListingMutation.isPending}
        onCancel={() => {
          setDeleteDialogVisible(false);
        }}
        onConfirm={() => {
          if (!selectedListing) {
            return;
          }

          void deleteHarvestListingMutation.mutateAsync(selectedListing.id);
        }}
      />

      <ConfirmationDialog
        visible={deleteDonationDialogVisible}
        title="Delete Donation?"
        message="This will permanently remove the selected donation from your store."
        confirmLabel="Delete Donation"
        cancelLabel="Cancel"
        loading={deleteDonationMutation.isPending}
        onCancel={() => {
          setDeleteDonationDialogVisible(false);
        }}
        onConfirm={() => {
          if (!selectedDonation) {
            return;
          }

          void deleteDonationMutation.mutateAsync(selectedDonation.id);
        }}
      />

      <ConfirmationDialog
        visible={deleteCompostDialogVisible}
        title="Delete Compost Listing?"
        message="This will permanently remove the selected compost listing from your store."
        confirmLabel="Delete Compost"
        cancelLabel="Cancel"
        loading={deleteCompostListingMutation.isPending}
        onCancel={() => {
          setDeleteCompostDialogVisible(false);
        }}
        onConfirm={() => {
          if (!selectedCompostListing) {
            return;
          }

          void deleteCompostListingMutation.mutateAsync(selectedCompostListing.id);
        }}
      />
    </Screen>
  );
}

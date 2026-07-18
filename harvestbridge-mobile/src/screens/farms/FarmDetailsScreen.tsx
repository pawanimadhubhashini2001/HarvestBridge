import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Dialog,
  HelperText,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

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
  getStoreLocation,
  getStoreLocationQueryKey,
  getStoreStatus,
  getStoreStatusQueryKey,
  updateStoreLocation,
  updateStoreStatus,
} from '@/api/store.api';
import { DeleteStoreButton } from '@/components/store/DeleteStoreButton';
import { FarmerProductCard } from '@/components/store/FarmerProductCard';
import { HarvestListingGalleryManager } from '@/components/store/HarvestListingGalleryManager';
import { StoreImageManager } from '@/components/store/StoreImageManager';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  buildAddressFromReverseGeocode,
  extractDistrictFromReverseGeocode,
  formatStoreCoordinates,
} from '@/utils/store-location';
import {
  formatStoreStatus,
  getStoreStatusLabel,
  STORE_STATUS_OPTIONS,
} from '@/utils/store-status';

function formatDateTime(value?: string | null) {
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
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View className="flex-row items-start justify-between gap-md">
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurface, flex: 1.2, textAlign: 'right', fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );
}

export function FarmDetailsScreen({ navigation }: AppStackScreenProps<'FarmDetails'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<HarvestListingDto | null>(null);
  const [galleryListingId, setGalleryListingId] = useState<number | null>(null);
  const [quantityDialogVisible, setQuantityDialogVisible] = useState(false);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [availableQuantityInput, setAvailableQuantityInput] = useState('');
  const [availableQuantityError, setAvailableQuantityError] = useState<string | null>(null);
  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });
  const store = storeQuery.data;
  const storeId = store?.id;
  const storeLocationQuery = useQuery({
    queryKey: getStoreLocationQueryKey(storeId),
    queryFn: () => getStoreLocation(storeId ?? ''),
    enabled: Boolean(storeId),
  });
  const storeStatusQuery = useQuery({
    queryKey: getStoreStatusQueryKey(storeId),
    queryFn: () => getStoreStatus(storeId ?? ''),
    enabled: Boolean(storeId),
  });
  const harvestListingsQuery = useQuery({
    queryKey: getHarvestListingsQueryKey(),
    queryFn: getHarvestListings,
    enabled: Boolean(storeId),
  });
  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      if (!storeId || !store) {
        throw new Error('Store profile is required before updating the location.');
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Location permission is required to update your store location.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const reverseResults = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const bestMatch = reverseResults[0];

      return updateStoreLocation(storeId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: buildAddressFromReverseGeocode(bestMatch) || store.address,
        district: extractDistrictFromReverseGeocode(bestMatch) || store.district,
      });
    },
    onSuccess: async (updatedLocation) => {
      if (!storeId) {
        return;
      }

      queryClient.setQueryData(getStoreLocationQueryKey(storeId), updatedLocation);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) }),
        queryClient.invalidateQueries({ queryKey: getStoreLocationQueryKey(storeId) }),
      ]);
      setLocationFeedback('Store location updated from your current device position.');
    },
    onError: (error) => {
      setLocationFeedback(getErrorMessage(error));
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: async (businessStatus: 'open' | 'closed' | 'temporarily_closed') => {
      if (!storeId) {
        throw new Error('Store profile is required before updating the status.');
      }

      return updateStoreStatus(storeId, {
        business_status: businessStatus,
      });
    },
    onSuccess: async (updatedStatus) => {
      if (!storeId) {
        return;
      }

      queryClient.setQueryData(getStoreStatusQueryKey(storeId), updatedStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) }),
        queryClient.invalidateQueries({ queryKey: getStoreStatusQueryKey(storeId) }),
      ]);
      setLocationFeedback(`Store status updated to ${getStoreStatusLabel(updatedStatus.business_status)}.`);
    },
    onError: (error) => {
      setLocationFeedback(getErrorMessage(error));
    },
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
      setLocationFeedback('Product availability updated successfully.');
    },
    onError: (error) => {
      setLocationFeedback(getErrorMessage(error));
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
      setLocationFeedback('Product deleted successfully.');
    },
    onError: (error) => {
      setLocationFeedback(getErrorMessage(error));
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

  const locationData = storeLocationQuery.data;
  const currentStoreStatus = storeStatusQuery.data?.business_status ?? store.business_status ?? 'open';
  const harvestListings = harvestListingsQuery.data ?? [];
  const galleryListing =
    harvestListings.find((listing) => listing.id === galleryListingId) ?? null;

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

  async function handleOpenMaps() {
    const targetUrl =
      locationData?.open_maps_action?.url ??
      locationData?.google_maps_url ??
      store.open_maps_action?.url ??
      store.google_maps_url;

    if (!targetUrl) {
      setLocationFeedback('Google Maps preview is not available until coordinates are saved.');
      return;
    }

    try {
      await Linking.openURL(targetUrl);
    } catch {
      setLocationFeedback('Unable to open Google Maps on this device.');
    }
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

  return (
    <Screen scrollable contentClassName="gap-lg">
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Chip
          compact
          style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
          textStyle={{ color: theme.colors.primary }}
        >
          Store Profile
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          {store.store_name}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          This is your public selling location for harvest listings and marketplace visibility.
        </Text>
      </View>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Store Information
            </Text>

            <DetailRow label="Store Name" value={store.store_name} />
            <DetailRow label="Phone Number" value={store.phone_number} />
            <DetailRow
              label="Description"
              value={store.store_description?.trim() || 'Not provided'}
            />
            <DetailRow
              label="Active Crops"
              value={`${store.active_crop_count ?? 0}`}
            />
            <DetailRow
              label="Business Status"
              value={formatStoreStatus(currentStoreStatus)}
            />
            <DetailRow label="Created Date" value={formatDateTime(store.created_at)} />
            <DetailRow label="Updated Date" value={formatDateTime(store.updated_at)} />
          </View>
        </Card.Content>
      </Card>

      <StoreImageManager storeId={store.id} store={store} />

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                My Products
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Manage the availability of your harvest listings. Customers only see products that are available.
              </Text>
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
              <View className="gap-sm rounded-lg border px-lg py-lg" style={{ borderColor: theme.colors.outline }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                  No products yet
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Your store is ready, but no harvest listings have been added for availability management yet.
                </Text>
              </View>
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

            {galleryListing ? (
              <HarvestListingGalleryManager listing={galleryListing} />
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                Store Status
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Control whether your store is open, closed, or temporarily closed for customers.
              </Text>
            </View>

            <Chip compact style={{ alignSelf: 'flex-start' }}>
              {formatStoreStatus(currentStoreStatus)}
            </Chip>

            <View className="flex-row flex-wrap gap-sm">
              {STORE_STATUS_OPTIONS.map((statusOption) => {
                const isActive = currentStoreStatus === statusOption;

                return (
                  <Button
                    key={statusOption}
                    mode={isActive ? 'contained' : 'outlined'}
                    disabled={updateStatusMutation.isPending}
                    loading={updateStatusMutation.isPending && isActive}
                    onPress={() => {
                      void updateStatusMutation.mutateAsync(statusOption);
                    }}
                  >
                    {getStoreStatusLabel(statusOption)}
                  </Button>
                );
              })}
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
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                Current Store Location
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Saved store coordinates are used for maps, nearby search, and future distance
                calculations.
              </Text>
            </View>

            {storeLocationQuery.isLoading && !locationData ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Loading store location...
              </Text>
            ) : storeLocationQuery.isError && !locationData ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {getErrorMessage(storeLocationQuery.error)}
              </Text>
            ) : (
              <View className="gap-sm">
                <DetailRow label="District" value={locationData?.district || store.district} />
                <DetailRow label="Address" value={locationData?.address || store.address || 'Not provided'} />
                <DetailRow
                  label="Coordinates"
                  value={formatStoreCoordinates(
                    locationData?.latitude ?? store.latitude,
                    locationData?.longitude ?? store.longitude,
                  )}
                />
                <DetailRow
                  label="Google Maps URL"
                  value={locationData?.google_maps_url ?? store.google_maps_url ?? 'Not available'}
                />
              </View>
            )}

            <View className="gap-sm">
              <Button
                mode="contained"
                loading={updateLocationMutation.isPending}
                disabled={updateLocationMutation.isPending}
                onPress={() => {
                  void updateLocationMutation.mutateAsync();
                }}
              >
                Use Current Location
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  navigation.navigate('EditFarm', { farmId: String(store.id) });
                }}
              >
                Change Location
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  void handleOpenMaps();
                }}
              >
                Open Google Maps Preview
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-sm">
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Actions
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                navigation.navigate('EditFarm', { farmId: String(store.id) });
              }}
            >
              Edit Store
            </Button>
            <DeleteStoreButton
              storeId={store.id}
              label="Delete Store"
              onDeleted={() => {
                navigation.replace('MainTabs', { screen: 'Farms' });
              }}
            />
            <Button
              mode="outlined"
              onPress={() => {
                navigation.navigate('AIRecommendationForm');
              }}
            >
              Create AI Recommendation
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={Boolean(locationFeedback)}
        onDismiss={() => {
          setLocationFeedback(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setLocationFeedback(null);
          },
        }}
      >
        {locationFeedback ?? ''}
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
    </Screen>
  );
}

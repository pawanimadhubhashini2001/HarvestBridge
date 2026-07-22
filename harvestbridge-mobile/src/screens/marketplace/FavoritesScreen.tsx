import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, useWindowDimensions, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text } from 'react-native-paper';

import {
  getFavorites,
  getFavoritesQueryKey,
  unfavoriteProduct,
  unfavoriteStore,
  type FavoriteStoreDto,
} from '@/api/favorites.api';
import type { MarketplaceListingDto } from '@/api/marketplace.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatStoreStatus } from '@/utils/store-status';
import { useState } from 'react';

function FavoriteStoreCard({
  store,
  onView,
  onRemove,
}: {
  store: FavoriteStoreDto;
  onView: () => void;
  onRemove: () => void;
}) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 390;
  const actionButtonStyle = isNarrow ? { flexGrow: 1 } : undefined;

  return (
    <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
      <View className="gap-md p-md">
        <View className={`${isNarrow ? 'gap-md' : 'flex-row gap-md'}`}>
          <View
            className="items-center justify-center overflow-hidden rounded-xl"
            style={{
              width: isNarrow ? '100%' : 80,
              height: isNarrow ? 140 : 80,
              backgroundColor: theme.colors.surfaceVariant,
            }}>
            {store.store_logo_url ? (
              <Image
                source={{ uri: store.store_logo_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No Logo
              </Text>
            )}
          </View>

          <View className="flex-1 gap-xs">
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              {store.store_name}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {store.store_description?.trim() || 'No store description provided.'}
            </Text>
            {store.business_status ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatStoreStatus(store.business_status)}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="gap-xs">
          <Text variant="bodyMedium">District: {store.district ?? 'Not available'}</Text>
          <Text variant="bodyMedium">Address: {store.address ?? 'Not available'}</Text>
          <Text variant="bodyMedium">Phone: {store.phone_number ?? 'Not available'}</Text>
        </View>

        <View className="flex-row flex-wrap gap-sm">
          <Button
            mode="contained"
            style={actionButtonStyle}
            contentStyle={{ minHeight: 44 }}
            onPress={onView}>
            View Store
          </Button>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={actionButtonStyle}
            contentStyle={{ minHeight: 44 }}
            onPress={onRemove}>
            Remove Favorite
          </Button>
        </View>
      </View>
    </Card>
  );
}

export function FavoritesScreen({ navigation }: AppTabScreenProps<'Favorites'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const favoritesQuery = useQuery({
    queryKey: getFavoritesQueryKey(),
    queryFn: getFavorites,
    enabled: user?.role === 'consumer',
  });

  const removeStoreMutation = useMutation({
    mutationFn: async (storeId: number) => unfavoriteStore(storeId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getFavoritesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['store', 'public'] }),
      ]);
      setFeedbackMessage('Store removed from favorites.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: number) => unfavoriteProduct(productId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getFavoritesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['marketplace'] }),
      ]);
      setFeedbackMessage('Product removed from favorites.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  async function openDirections(url?: string | null) {
    if (!url) {
      setFeedbackMessage('Directions are not available for this product.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setFeedbackMessage('Unable to open directions right now.');
    }
  }

  if (user?.role !== 'consumer') {
    return (
      <ErrorState
        title="Favorites unavailable"
        message="Only authenticated consumers can manage favorites."
      />
    );
  }

  if (favoritesQuery.isLoading && !favoritesQuery.data) {
    return <LoadingState message="Loading your favorites..." />;
  }

  if (favoritesQuery.isError && !favoritesQuery.data) {
    return (
      <ErrorState
        title="Unable to load favorites"
        message={getErrorMessage(favoritesQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void favoritesQuery.refetch();
        }}
      />
    );
  }

  const favorites = favoritesQuery.data;

  if (!favorites) {
    return (
      <ErrorState
        title="Favorites unavailable"
        message="Your favorites could not be loaded right now."
      />
    );
  }

  const hasFavorites = favorites.stores.length > 0 || favorites.products.length > 0;

  return (
    <Screen
      scrollable
      refreshing={favoritesQuery.isRefetching}
      onRefresh={() => {
        void favoritesQuery.refetch();
      }}
      contentClassName="gap-md">
      <View
        className="gap-sm rounded-lg border p-md"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
          Favorites
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Save stores and products you want to revisit quickly.
        </Text>
      </View>

      {!hasFavorites ? (
        <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
          <View className="gap-sm p-md">
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>
              No favorites yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Tap the heart icon on a store or product to save it here.
            </Text>
          </View>
        </Card>
      ) : null}

      <View className="gap-md">
        <Text variant="titleLarge" style={{ fontWeight: '700' }}>
          Favorite Stores
        </Text>

        {favorites.stores.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No favorite stores saved yet.
          </Text>
        ) : (
          favorites.stores.map((store, index) => (
            <View key={`favorite-store-${store.id}`} className="gap-md">
              {index > 0 ? <Divider /> : null}
              <FavoriteStoreCard
                store={store}
                onView={() => {
                  navigation.navigate('StoreDetails', {
                    storeId: String(store.id),
                  });
                }}
                onRemove={() => {
                  void removeStoreMutation.mutateAsync(store.id);
                }}
              />
            </View>
          ))
        )}
      </View>

      <View className="gap-md">
        <Text variant="titleLarge" style={{ fontWeight: '700' }}>
          Favorite Products
        </Text>

        {favorites.products.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No favorite products saved yet.
          </Text>
        ) : (
          favorites.products.map((product: MarketplaceListingDto, index) => (
            <View key={`favorite-product-${product.id}`} className="gap-md">
              {index > 0 ? <Divider /> : null}
              <MarketplaceProductCard
                item={product}
                onPress={() => {
                  navigation.navigate('MarketplaceProductDetails', {
                    listingId: String(product.id),
                  });
                }}
                onCallPress={async () => {
                  const phone = product.store?.phone_number ?? null;
                  if (!phone) {
                    setFeedbackMessage('Phone details are not available for this favorite product.');
                    return;
                  }

                  try {
                    await Linking.openURL(`tel:${phone}`);
                  } catch {
                    setFeedbackMessage('Unable to start a phone call right now.');
                  }
                }}
                onDirectionsPress={() => {
                  void openDirections(product.open_maps_action?.url ?? product.google_maps_url ?? null);
                }}
              />
              <Button
                mode="outlined"
                textColor={theme.colors.error}
                contentStyle={{ minHeight: 44 }}
                onPress={() => {
                  void removeProductMutation.mutateAsync(product.id);
                }}>
                Remove Favorite
              </Button>
            </View>
          ))
        )}
      </View>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

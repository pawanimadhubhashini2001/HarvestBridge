import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import { DeleteStoreButton } from '@/components/store/DeleteStoreButton';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatStoreStatus } from '@/utils/store-status';

export function MyFarmsScreen({ navigation }: AppTabScreenProps<'Farms'>) {
  const theme = useAppTheme();
  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
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
            Create your store before selling
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Farmers now create one Store Profile instead of adding farms. Your store becomes the
            selling location behind future harvest listings.
          </Text>
        </View>

        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
        >
          <Card.Content>
            <View className="gap-md">
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                No store profile yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Add your store name, phone number, district, address, and optional map location so
                you can continue with marketplace publishing and related farmer tools.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('AddFarm');
                }}
              >
                Create Store Profile
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Screen>
    );
  }

  const store = storeQuery.data;

  return (
    <Screen
      scrollable
      refreshing={storeQuery.isRefetching}
      onRefresh={() => {
        void storeQuery.refetch();
      }}
      contentClassName="gap-lg"
    >
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
          Your single selling location is ready for harvest listing and marketplace activity.
        </Text>
      </View>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{store.district}</Chip>
              <Chip compact>{store.active_crop_count ?? 0} active crops</Chip>
              <Chip compact>{formatStoreStatus(store.business_status)}</Chip>
            </View>

            <View className="gap-sm">
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {store.address}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Phone: {store.phone_number}
              </Text>
              {store.store_description?.trim() ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {store.store_description}
                </Text>
              ) : null}
            </View>

            <View className="gap-sm">
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('FarmDetails', { farmId: String(store.id) });
                }}
              >
                My Store
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  navigation.navigate('EditFarm', { farmId: String(store.id) });
                }}
              >
                Edit Store
              </Button>
              <DeleteStoreButton storeId={store.id} label="Delete Store" />
            </View>
          </View>
        </Card.Content>
      </Card>
    </Screen>
  );
}

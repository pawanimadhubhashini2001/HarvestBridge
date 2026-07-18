import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

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

function formatCoordinates(latitude?: string | number | null, longitude?: string | number | null) {
  const latitudeNumber = typeof latitude === 'number' ? latitude : Number(latitude);
  const longitudeNumber = typeof longitude === 'number' ? longitude : Number(longitude);

  if (Number.isNaN(latitudeNumber) || Number.isNaN(longitudeNumber)) {
    return 'Not provided';
  }

  return `${latitudeNumber.toFixed(4)}, ${longitudeNumber.toFixed(4)}`;
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

  const store = storeQuery.data;
  const storeImage = store.store_image_url ?? store.store_logo_url ?? null;

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

            {storeImage ? (
              <View className="overflow-hidden rounded-lg">
                <Image
                  source={{ uri: storeImage }}
                  style={{ width: '100%', height: 220 }}
                  contentFit="cover"
                />
              </View>
            ) : null}

            <DetailRow label="Store Name" value={store.store_name} />
            <DetailRow label="Phone Number" value={store.phone_number} />
            <DetailRow label="District" value={store.district} />
            <DetailRow label="Address" value={store.address || 'Not provided'} />
            <DetailRow
              label="Coordinates"
              value={formatCoordinates(store.latitude, store.longitude)}
            />
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
              value={store.business_status ?? 'open'}
            />
            <DetailRow label="Created Date" value={formatDateTime(store.created_at)} />
            <DetailRow label="Updated Date" value={formatDateTime(store.updated_at)} />
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
              Edit Store Profile
            </Button>
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
    </Screen>
  );
}

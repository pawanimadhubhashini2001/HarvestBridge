import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Divider, Snackbar, Text } from 'react-native-paper';

import { deleteFarm, getFarms, getFarmsQueryKey, type FarmDto } from '@/api/farm.api';
import { getRecommendations } from '@/api/recommendation.api';
import { getCurrentWeather, getCurrentWeatherQueryKey } from '@/api/weather.api';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
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

function formatFarmSize(value: string | number, unit: FarmDto['farm_size_unit']) {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value} ${unit}`;
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(numericValue)} ${unit}`;
}

function formatCoordinates(latitude: string | number, longitude: string | number) {
  const latitudeNumber = typeof latitude === 'number' ? latitude : Number(latitude);
  const longitudeNumber = typeof longitude === 'number' ? longitude : Number(longitude);

  if (Number.isNaN(latitudeNumber) || Number.isNaN(longitudeNumber)) {
    return 'Not available';
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

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
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
          {children}
        </View>
      </Card.Content>
    </Card>
  );
}

export function FarmDetailsScreen({
  navigation,
  route,
}: AppStackScreenProps<'FarmDetails'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const farmId = route.params?.farmId;
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const farmsQuery = useQuery({
    queryKey: getFarmsQueryKey(),
    queryFn: getFarms,
    enabled: Boolean(farmId),
  });

  const farms = farmsQuery.data ?? [];
  const farm = farms.find((farmItem) => String(farmItem.id) === farmId);
  const weatherQuery = useQuery({
    queryKey: getCurrentWeatherQueryKey(farm?.district),
    queryFn: () => getCurrentWeather(farm?.district ?? ''),
    enabled: Boolean(farm?.district),
  });
  const recommendationsQuery = useQuery({
    queryKey: ['recommendations', 'history', 'farm-details'],
    queryFn: getRecommendations,
  });
  const deleteFarmMutation = useMutation({
    mutationFn: async () => {
      if (!farmId) {
        throw new Error('Farm id is required to delete a farm.');
      }

      return deleteFarm(farmId);
    },
    onSuccess: async () => {
      setDeleteDialogVisible(false);
      setFeedbackMessage('Farm deleted successfully. Returning...');
      queryClient.setQueryData<FarmDto[]>(getFarmsQueryKey(), (currentFarms) =>
        currentFarms?.filter((farmItem) => String(farmItem.id) !== farmId) ?? [],
      );
      await queryClient.invalidateQueries({ queryKey: getFarmsQueryKey() });
      await queryClient.refetchQueries({ queryKey: getFarmsQueryKey(), type: 'active' });
      setTimeout(() => {
        navigation.goBack();
      }, 700);
    },
    onError: (error: Error) => {
      setDeleteDialogVisible(false);
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      farmsQuery.refetch(),
      weatherQuery.refetch(),
      recommendationsQuery.refetch(),
    ]);
  };

  if (!farmId) {
    return (
      <ErrorState
        title="Farm not found"
        message="A farm id was not provided for this details screen."
        actionLabel="Back to farms"
        onAction={() => {
          navigation.navigate('MainTabs', { screen: 'Farms' });
        }}
      />
    );
  }

  if (farmsQuery.isLoading && !farmsQuery.data) {
    return <LoadingState message="Loading farm details..." />;
  }

  if (farmsQuery.isError && !farmsQuery.data) {
    return (
      <ErrorState
        title="Unable to load farm details"
        message={getErrorMessage(farmsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void farmsQuery.refetch();
        }}
      />
    );
  }

  if (!farm) {
    return (
      <Screen scrollable>
        <SectionCard title="Farm Details" subtitle="Farm Module">
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            We could not find that farm in your current farm list.
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              navigation.navigate('MainTabs', { screen: 'Farms' });
            }}
          >
            Back to farms
          </Button>
        </SectionCard>
      </Screen>
    );
  }

  const recommendationItems = recommendationsQuery.data?.data?.slice(0, 3) ?? [];

  return (
    <Screen
      scrollable
      refreshing={
        farmsQuery.isRefetching || weatherQuery.isRefetching || recommendationsQuery.isRefetching
      }
      onRefresh={() => {
        void handleRefresh();
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
          Farm Module
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          {farm.farm_name}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Detailed farm information, optional weather context, and available activity summaries.
        </Text>
      </View>

      <SectionCard title="Farm Information">
        <DetailRow label="Farm Name" value={farm.farm_name} />
        <DetailRow label="Address" value={farm.address || 'Not provided'} />
        <DetailRow label="District" value={farm.district || 'Not provided'} />
        <DetailRow
          label="Coordinates"
          value={formatCoordinates(farm.latitude, farm.longitude)}
        />
        <DetailRow
          label="Farm Size"
          value={formatFarmSize(farm.farm_size, farm.farm_size_unit)}
        />
        <DetailRow label="Soil Type" value={farm.soil_type || 'Not provided'} />
        <DetailRow label="Description" value={farm.description?.trim() || 'Not provided'} />
        <DetailRow label="Created Date" value={formatDateTime(farm.created_at)} />
        <DetailRow label="Updated Date" value={formatDateTime(farm.updated_at)} />
      </SectionCard>

      <SectionCard
        title="Assigned Crops"
        subtitle="Detailed crop assignments are not exposed by the current farm resource."
      >
        <View className="gap-sm">
          <Chip
            compact
            style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.secondaryContainer }}
            textStyle={{ color: theme.colors.secondary }}
          >
            {farm.active_crop_count ?? 0} active crop{farm.active_crop_count === 1 ? '' : 's'}
          </Chip>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            The current Laravel farm response provides the active crop count, but not the full crop
            names for this farm.
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Weather Summary"
        subtitle="Current weather for the farm district when available."
      >
        {weatherQuery.isLoading && !weatherQuery.data ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading weather summary...
          </Text>
        ) : null}

        {!weatherQuery.isLoading && weatherQuery.isError ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {getErrorMessage(weatherQuery.error)}
          </Text>
        ) : null}

        {!weatherQuery.isLoading && !weatherQuery.isError && !weatherQuery.data ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Weather data is not available for this farm right now.
          </Text>
        ) : null}

        {weatherQuery.data ? (
          <View className="gap-sm">
            <DetailRow
              label="Condition"
              value={
                weatherQuery.data.condition_description ||
                weatherQuery.data.condition ||
                'Not available'
              }
            />
            <DetailRow
              label="Temperature"
              value={`${weatherQuery.data.temperature}°C`}
            />
            <DetailRow label="Humidity" value={`${weatherQuery.data.humidity}%`} />
            <DetailRow
              label="Wind Speed"
              value={
                weatherQuery.data.wind_speed !== null && weatherQuery.data.wind_speed !== undefined
                  ? `${weatherQuery.data.wind_speed} km/h`
                  : 'Not available'
              }
            />
            <DetailRow
              label="Rain Probability"
              value={
                weatherQuery.data.rain_probability !== null &&
                weatherQuery.data.rain_probability !== undefined
                  ? `${weatherQuery.data.rain_probability}%`
                  : 'Not available'
              }
            />
            <DetailRow
              label="Last Updated"
              value={formatDateTime(weatherQuery.data.last_updated)}
            />
          </View>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Recent Recommendations"
        subtitle="Current API exposes account-level recommendation history, not farm-specific history."
      >
        {recommendationsQuery.isLoading && !recommendationsQuery.data ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Loading recent recommendations...
          </Text>
        ) : null}

        {!recommendationsQuery.isLoading && recommendationsQuery.isError ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {getErrorMessage(recommendationsQuery.error)}
          </Text>
        ) : null}

        {!recommendationsQuery.isLoading &&
        !recommendationsQuery.isError &&
        recommendationItems.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No recent recommendations are available yet.
          </Text>
        ) : null}

        {recommendationItems.length > 0 ? (
          <View className="gap-md">
            {recommendationItems.map((recommendation, index) => (
              <View key={recommendation.id} className="gap-sm">
                <View className="flex-row items-center justify-between gap-sm">
                  <Text
                    variant="titleMedium"
                    style={{ color: theme.colors.onSurface, fontWeight: '700', flex: 1 }}
                  >
                    {recommendation.recommended_crop}
                  </Text>
                  <Chip compact>{Math.round(recommendation.confidence * 100)}%</Chip>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {recommendation.district} • {recommendation.season} • {recommendation.market_demand}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatDateTime(recommendation.created_at)}
                </Text>
                {index < recommendationItems.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Actions">
        <View className="gap-sm">
          <Button
            mode="contained"
            onPress={() => {
              navigation.navigate('EditFarm', { farmId: String(farm.id) });
            }}
          >
            Edit Farm
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              navigation.navigate('AIRecommendationForm');
            }}
          >
            Create AI Recommendation
          </Button>
          <Button
            mode="text"
            textColor={theme.colors.error}
            disabled={deleteFarmMutation.isPending}
            onPress={() => {
              setDeleteDialogVisible(true);
            }}
          >
            Delete Farm
          </Button>
        </View>
      </SectionCard>

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

      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete farm?"
        message={`This will permanently remove ${farm.farm_name}. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteFarmMutation.isPending}
        onCancel={() => {
          if (!deleteFarmMutation.isPending) {
            setDeleteDialogVisible(false);
          }
        }}
        onConfirm={() => {
          void deleteFarmMutation.mutateAsync();
        }}
      />
    </Screen>
  );
}

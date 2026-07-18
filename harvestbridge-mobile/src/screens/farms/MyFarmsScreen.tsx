import { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Chip,
  FAB,
  Searchbar,
  Snackbar,
  Text,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

import { getFarms, getFarmsQueryKey, type FarmDto } from '@/api/farm.api';
import { ErrorState } from '@/components/common/error-state';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

type FarmStatus = string;
type FarmListItem = FarmDto | { kind: 'skeleton'; key: string };

function formatFarmSize(value: string | number, unit: FarmDto['farm_size_unit']) {
  const numericValue = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value} ${unit}`;
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(numericValue)} ${unit}`;
}

function formatCreatedDate(value: string) {
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

function getSearchableText(farm: FarmDto) {
  return [farm.farm_name, farm.district, farm.soil_type, farm.address].join(' ').toLowerCase();
}

function getFarmStatus(farm: FarmDto) {
  const candidate = (farm as FarmDto & { status?: unknown }).status;

  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : null;
}

function SkeletonBlock({ height, width }: { height: number; width: DimensionValue }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        height,
        width,
        borderRadius: 999,
        backgroundColor: theme.colors.surfaceVariant,
      }}
    />
  );
}

function FarmCardSkeleton() {
  const theme = useAppTheme();

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className="gap-sm">
            <SkeletonBlock height={16} width="32%" />
            <SkeletonBlock height={28} width="68%" />
            <SkeletonBlock height={16} width="44%" />
          </View>

          <View className="gap-sm">
            <SkeletonBlock height={16} width="100%" />
            <SkeletonBlock height={16} width="92%" />
            <SkeletonBlock height={16} width="74%" />
          </View>

          <View className="flex-row gap-sm">
            <SkeletonBlock height={36} width="34%" />
            <SkeletonBlock height={36} width="34%" />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function EmptyState({
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
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-sm px-sm py-md">
          <Chip
            compact
            style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
            textStyle={{ color: theme.colors.primary }}
          >
            My Farms
          </Chip>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {message}
          </Text>
          <Button mode="contained" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

function FarmCard({
  farm,
  onPress,
  onEdit,
  onDelete,
}: {
  farm: FarmDto;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useAppTheme();
  const status = getFarmStatus(farm);

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <Pressable onPress={onPress}>
            <View className="gap-sm">
              <View className="flex-row flex-wrap items-center gap-sm">
                <Chip
                  compact
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                  textStyle={{ color: theme.colors.secondary }}
                >
                  {farm.district}
                </Chip>
                <Chip
                  compact
                  style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                >
                  {farm.soil_type}
                </Chip>
                {status ? (
                  <Chip
                    compact
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: theme.colors.primaryContainer,
                    }}
                    textStyle={{ color: theme.colors.primary }}
                  >
                    {status}
                  </Chip>
                ) : null}
              </View>

              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {farm.farm_name}
              </Text>
            </View>

            <View className="gap-sm">
              <View className="flex-row items-center justify-between gap-md">
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Size
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                >
                  {formatFarmSize(farm.farm_size, farm.farm_size_unit)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-md">
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Active Crops
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                >
                  {farm.active_crop_count ?? 0}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-md">
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Created
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                >
                  {formatCreatedDate(farm.created_at)}
                </Text>
              </View>
            </View>

            <View
              className="gap-xs rounded-lg px-md py-md"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Farm Location
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {farm.address}
              </Text>
            </View>
          </Pressable>

          <View className="flex-row gap-sm">
            <Button mode="outlined" onPress={onEdit} style={{ flex: 1 }}>
              Edit Farm
            </Button>
            <Button
              mode="text"
              textColor={theme.colors.error}
              onPress={onDelete}
              style={{ flex: 1 }}
            >
              Delete Farm
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export function MyFarmsScreen({ navigation }: AppTabScreenProps<'Farms'>) {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FarmStatus | null>(null);
  const [deleteFarmName, setDeleteFarmName] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const farmsQuery = useQuery({
    queryKey: getFarmsQueryKey(),
    queryFn: getFarms,
  });

  const farms = farmsQuery.data ?? [];
  const trimmedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const statuses = Array.from(
    new Set(
      farms
        .map((farm) => getFarmStatus(farm))
        .filter((status): status is FarmStatus => Boolean(status)),
    ),
  );
  const filteredFarms = farms.filter((farm) => {
    const matchesSearch =
      trimmedSearchQuery.length === 0 || getSearchableText(farm).includes(trimmedSearchQuery);
    const farmStatus = getFarmStatus(farm);
    const matchesStatus = !selectedStatus || farmStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });
  const listData: FarmListItem[] =
    farmsQuery.isLoading && !farmsQuery.data
      ? [
          { kind: 'skeleton', key: 'farm-skeleton-1' },
          { kind: 'skeleton', key: 'farm-skeleton-2' },
          { kind: 'skeleton', key: 'farm-skeleton-3' },
        ]
      : filteredFarms;

  if (farmsQuery.isError && !farmsQuery.data) {
    return (
      <ErrorState
        title="Unable to load farms"
        message={getErrorMessage(farmsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void farmsQuery.refetch();
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        <FlatList
          data={listData}
          keyExtractor={(item) => ('kind' in item ? item.key : String(item.id))}
          contentContainerStyle={{
            gap: 16,
            padding: 16,
            paddingBottom: 112,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={farmsQuery.isRefetching}
              onRefresh={() => {
                void farmsQuery.refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={
            <View className="gap-md">
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
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                >
                  My Farms
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Review your farm records, open farm details, and prepare edit or delete actions.
                </Text>
              </View>

              <View
                className="gap-sm rounded-lg border px-md py-md"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
              >
                <Searchbar
                  placeholder="Search by farm name, district, soil type, or address"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  elevation={0}
                />

                <View className="flex-row flex-wrap items-center gap-sm">
                  <Chip
                    compact
                    selected={!selectedStatus}
                    onPress={() => {
                      setSelectedStatus(null);
                    }}
                  >
                    All Farms
                  </Chip>
                  {statuses.map((status) => (
                    <Chip
                      key={status}
                      compact
                      selected={selectedStatus === status}
                      onPress={() => {
                        setSelectedStatus((currentStatus) =>
                          currentStatus === status ? null : status,
                        );
                      }}
                    >
                      {status}
                    </Chip>
                  ))}
                </View>

                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {farmsQuery.isLoading && !farmsQuery.data
                    ? 'Loading your farms...'
                    : `${farms.length} farm${farms.length === 1 ? '' : 's'} in your account${
                        trimmedSearchQuery || selectedStatus
                          ? ` • ${filteredFarms.length} matching`
                          : ''
                      }`}
                </Text>

                {!farmsQuery.isLoading && farms.length > 0 && statuses.length === 0 ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Status filtering is hidden because the current farm API does not return a farm
                    status field.
                  </Text>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            farmsQuery.isLoading && !farmsQuery.data ? null : farms.length === 0 ? (
              <EmptyState
                title="No farms added yet"
                message="Create your first farm to start tracking land details, crops, and future recommendations."
                actionLabel="Add Farm"
                onAction={() => {
                  navigation.navigate('AddFarm');
                }}
              />
            ) : (
              <EmptyState
                title="No farms match your filters"
                message="Try a different search term or clear the current status filter to see more results."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedStatus(null);
                }}
              />
            )
          }
          renderItem={({ item }) =>
            'kind' in item ? (
              <FarmCardSkeleton />
            ) : (
              <FarmCard
                farm={item}
                onPress={() => {
                  navigation.navigate('FarmDetails', { farmId: String(item.id) });
                }}
                onEdit={() => {
                  navigation.navigate('EditFarm', { farmId: String(item.id) });
                }}
                onDelete={() => {
                  setDeleteFarmName(item.farm_name);
                }}
              />
            )
          }
        />

        <FAB
          icon="plus"
          label="Add Farm"
          onPress={() => {
            navigation.navigate('AddFarm');
          }}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            backgroundColor: theme.colors.primary,
          }}
          color={theme.colors.onPrimary}
        />

        <Snackbar
          visible={Boolean(deleteFarmName)}
          onDismiss={() => {
            setDeleteFarmName(null);
          }}
          action={{
            label: 'Close',
            onPress: () => {
              setDeleteFarmName(null);
            },
          }}
        >
          {deleteFarmName
            ? `Delete Farm is available for ${deleteFarmName}, but the delete flow is not implemented in Lesson 116.`
            : ''}
        </Snackbar>
      </View>
    </SafeAreaView>
  );
}

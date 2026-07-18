import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import { getFarms, getFarmsQueryKey, type FarmDto } from '@/api/farm.api';
import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function SkeletonBlock({ height, width }: { height: number; width: number | string }) {
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

function SummaryMetric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View
      className="min-w-[140px] flex-1 gap-xs rounded-lg px-md py-sm"
      style={{ backgroundColor: theme.colors.surfaceVariant }}
    >
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

function toNumber(value: number | string) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAreaValue(value: number) {
  if (Number.isInteger(value)) {
    return `${value}`;
  }

  return value.toFixed(1);
}

function formatTotalArea(farms: FarmDto[]) {
  const totals = farms.reduce(
    (accumulator, farm) => {
      const size = toNumber(farm.farm_size);

      if (farm.farm_size_unit === 'hectares') {
        accumulator.hectares += size;
      } else {
        accumulator.acres += size;
      }

      return accumulator;
    },
    {
      acres: 0,
      hectares: 0,
    },
  );

  const parts = [
    totals.acres > 0 ? `${formatAreaValue(totals.acres)} acres` : null,
    totals.hectares > 0 ? `${formatAreaValue(totals.hectares)} hectares` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' + ') : '0 acres';
}

function getRecentlyUpdatedFarm(farms: FarmDto[]) {
  return [...farms].sort((left, right) => {
    const leftDate = new Date(left.updated_at ?? left.created_at).getTime();
    const rightDate = new Date(right.updated_at ?? right.created_at).getTime();

    return rightDate - leftDate;
  })[0];
}

function formatRecentUpdateLabel(farm?: FarmDto) {
  if (!farm) {
    return 'No recent updates';
  }

  return `${farm.farm_name} in ${farm.district}`;
}

function formatRecentUpdateHelper(farm?: FarmDto) {
  if (!farm) {
    return 'Create your first farm to see the latest update here.';
  }

  const date = new Date(farm.updated_at ?? farm.created_at);

  if (Number.isNaN(date.getTime())) {
    return 'Last update date unavailable';
  }

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)}`;
}

export function FarmSummaryCard() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const farmsQuery = useQuery({
    queryKey: getFarmsQueryKey(),
    queryFn: getFarms,
  });

  const actionStackClassName = isWide ? 'flex-row gap-sm' : 'gap-sm';

  if (farmsQuery.isLoading && !farmsQuery.data) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              Farm Summary
            </Chip>
            <View className="gap-sm">
              <SkeletonBlock height={34} width="38%" />
              <SkeletonBlock height={22} width="50%" />
            </View>
            <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (farmsQuery.isError) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.error }}
            >
              Farm Summary
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: '700' }}>
              Unable to load farms
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {getErrorMessage(farmsQuery.error)}
            </Text>
            <View className={actionStackClassName}>
              <AppButton
                label="View Farms"
                mode="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('Farms');
                }}
              />
              <AppButton
                label="Add Farm"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('AddFarm');
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const farms = farmsQuery.data ?? [];

  if (farms.length === 0) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              Farm Summary
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              No farms added yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Add your first farm to start tracking acreage, crops, and farm activity.
            </Text>
            <View className={actionStackClassName}>
              <AppButton
                label="View Farms"
                mode="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('Farms');
                }}
              />
              <AppButton
                label="Add Farm"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('AddFarm');
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const totalFarms = farms.length;
  const totalActiveCrops = farms.reduce(
    (total, farm) =>
      total + (typeof farm.active_crop_count === 'number' ? farm.active_crop_count : 0),
    0,
  );
  const totalFarmArea = formatTotalArea(farms);
  const recentlyUpdatedFarm = getRecentlyUpdatedFarm(farms);

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className={isWide ? 'flex-row items-start justify-between gap-md' : 'gap-sm'}>
            <View className="flex-1 gap-xs">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                Farm Summary
              </Chip>
              <Text
                variant="headlineMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {totalFarms} {totalFarms === 1 ? 'Farm' : 'Farms'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Total area across your registered farms: {totalFarmArea}
              </Text>
            </View>

            <View
              className="gap-xs rounded-lg px-md py-sm"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Recently Updated
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {formatRecentUpdateLabel(recentlyUpdatedFarm)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatRecentUpdateHelper(recentlyUpdatedFarm)}
              </Text>
            </View>
          </View>

          <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
            <SummaryMetric label="Total Farms" value={`${totalFarms}`} />
            <SummaryMetric label="Total Active Crops" value={`${totalActiveCrops}`} />
            <SummaryMetric label="Total Farm Area" value={totalFarmArea} />
          </View>

          <View className={actionStackClassName}>
            <AppButton
              label="View Farms"
              mode="outline"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('Farms');
              }}
            />
            <AppButton
              label="Add Farm"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('AddFarm');
              }}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

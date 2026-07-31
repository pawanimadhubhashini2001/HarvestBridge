import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions, type DimensionValue, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatStoreStatus } from '@/utils/store-status';

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

function formatUpdatedDate(value?: string | null) {
  if (!value) {
    return 'No recent updates';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No recent updates';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function FarmSummaryCard() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });
  const actionStackClassName = isWide ? 'flex-row gap-sm' : 'gap-sm';

  if (storeQuery.isLoading && storeQuery.data === undefined) {
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
              Store Summary
            </Chip>
            <View className="gap-sm">
              <SkeletonBlock height={34} width="40%" />
              <SkeletonBlock height={22} width="56%" />
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

  if (storeQuery.isError && storeQuery.data === undefined) {
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
              Store Summary
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: '700' }}>
              Unable to load your store profile
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {getErrorMessage(storeQuery.error)}
            </Text>
            <View className={actionStackClassName}>
              <AppButton
                label="View Store"
                mode="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('MainTabs', { screen: 'Farms' });
                }}
              />
              <AppButton
                label="Create Store"
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

  if (!storeQuery.data) {
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
              Store Summary
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              No store profile yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Create your single store profile before publishing harvest listings and marketplace
              products.
            </Text>
            <View className={actionStackClassName}>
              <AppButton
                label="Open Store"
                mode="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('MainTabs', { screen: 'Farms' });
                }}
              />
              <AppButton
                label="Create Store"
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

  const store = storeQuery.data;

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
                Store Summary
              </Chip>
              <Text
                variant="headlineMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {store.store_name}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {store.address}
              </Text>
            </View>

            <View
              className="gap-xs rounded-lg px-md py-sm"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Last Updated
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {formatUpdatedDate(store.updated_at ?? store.created_at)}
              </Text>
            </View>
          </View>

          <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
            <SummaryMetric label="Store Status" value={formatStoreStatus(store.business_status)} />
            <SummaryMetric label="Phone Number" value={store.phone_number} />
            <SummaryMetric label="Active Crops" value={`${store.active_crop_count ?? 0}`} />
          </View>

          <View className={actionStackClassName}>
            <AppButton
              label="View Store"
              mode="outline"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('FarmDetails', { farmId: String(store.id) });
              }}
            />
            <AppButton
              label="Edit Store"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('EditFarm', { farmId: String(store.id) });
              }}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

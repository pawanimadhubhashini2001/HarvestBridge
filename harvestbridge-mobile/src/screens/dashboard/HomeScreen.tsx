import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { getMyStoreQueryKey } from '@/api/store.api';
import { getCurrentWeatherQueryKey } from '@/api/weather.api';
import { FarmSummaryCard } from '@/components/dashboard/FarmSummaryCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function HomeScreen(_: AppTabScreenProps<'Home'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now);
  const currentDateLabel = formatDate(now);
  const weatherCity = user?.district?.trim() || undefined;
  const storeQueryKey = getMyStoreQueryKey();
  const weatherQueryKey = getCurrentWeatherQueryKey(weatherCity);
  const storeFetchCount = useIsFetching({ queryKey: storeQueryKey });
  const weatherFetchCount = useIsFetching({ queryKey: weatherQueryKey });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: storeQueryKey,
        type: 'active',
      }),
      weatherCity
        ? queryClient.refetchQueries({
            queryKey: weatherQueryKey,
            type: 'active',
          })
        : Promise.resolve(),
    ]);
  };

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={storeFetchCount > 0 || weatherFetchCount > 0}
      onRefresh={() => {
        void handleRefresh();
      }}
    >
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
      >
        <Chip style={{ alignSelf: 'flex-start' }} compact>
          Farmer Dashboard
        </Chip>
        <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
          {greeting}, {user?.name ?? 'Farmer'}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {currentDateLabel}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Here is your farmer dashboard with live weather and store summary.
        </Text>
      </View>

      <WeatherCard city={weatherCity} />
      <FarmSummaryCard />
    </Screen>
  );
}

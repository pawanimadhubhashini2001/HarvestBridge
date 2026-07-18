import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { getFarms, getFarmsQueryKey } from '@/api/farm.api';
import { getPredictionHistory, getPredictionHistoryQueryKey } from '@/api/recommendation.api';
import { getAnalyticsQueryKey } from '@/api/analytics.api';
import { getCurrentWeatherQueryKey } from '@/api/weather.api';
import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { AIRecommendationCard } from '@/components/dashboard/AIRecommendationCard';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { FarmSummaryCard } from '@/components/dashboard/FarmSummaryCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { APP_NAME, QUERY_STALE_TIME_MS } from '@/constants/app';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

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

export function HomeScreen({ navigation }: AppTabScreenProps<'Home'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now);
  const currentDateLabel = formatDate(now);
  const weatherCity = user?.district?.trim() || undefined;
  const isTwoColumn = width >= 720;
  const analyticsQueryKey = getAnalyticsQueryKey('trends').slice(0, 2);
  const farmsQueryKey = getFarmsQueryKey();
  const aiHistoryQueryKey = getPredictionHistoryQueryKey();
  const weatherQueryKey = getCurrentWeatherQueryKey(weatherCity);
  const analyticsFetchCount = useIsFetching({ queryKey: analyticsQueryKey });
  const farmsFetchCount = useIsFetching({ queryKey: farmsQueryKey });
  const aiHistoryFetchCount = useIsFetching({ queryKey: aiHistoryQueryKey });
  const weatherFetchCount = useIsFetching({ queryKey: weatherQueryKey });
  const farmsQuery = useQuery({
    queryKey: farmsQueryKey,
    queryFn: getFarms,
    staleTime: QUERY_STALE_TIME_MS,
  });
  const aiHistoryQuery = useQuery({
    queryKey: aiHistoryQueryKey,
    staleTime: QUERY_STALE_TIME_MS,
    queryFn: getPredictionHistory,
  });

  const handleRefresh = async () => {
    await Promise.all([
      farmsQuery.refetch(),
      aiHistoryQuery.refetch(),
      queryClient.refetchQueries({
        queryKey: analyticsQueryKey,
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

  const farms = farmsQuery.data ?? [];
  const history = aiHistoryQuery.data ?? [];

  const isEmpty =
    !farmsQuery.isLoading &&
    !aiHistoryQuery.isLoading &&
    farms.length === 0 &&
    history.length === 0 &&
    !weatherCity;

  if (
    farmsQuery.isLoading &&
    !farmsQuery.data &&
    aiHistoryQuery.isLoading &&
    !aiHistoryQuery.data
  ) {
    return <LoadingState message="Loading your farmer dashboard..." />;
  }

  if (farmsQuery.isError && !farmsQuery.data) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message={getErrorMessage(farmsQuery.error)}
        actionLabel="Reload dashboard"
        onAction={() => {
          void farmsQuery.refetch();
        }}
      />
    );
  }

  if (isEmpty) {
    return (
      <Screen
        scrollable
        contentClassName="gap-lg"
        refreshing={
          farmsQuery.isRefetching ||
          aiHistoryQuery.isRefetching ||
          analyticsFetchCount > 0 ||
          farmsFetchCount > 0 ||
          aiHistoryFetchCount > 0 ||
          weatherFetchCount > 0
        }
        onRefresh={() => {
          void handleRefresh();
        }}
      >
        <View className="flex-1 justify-center gap-md">
          <Text variant="headlineSmall">Your dashboard is ready</Text>
          <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
            Add your first farm or generate an AI recommendation to start filling the {APP_NAME}{' '}
            home dashboard.
          </Text>
          <View className="gap-md">
            <AppButton
              label="Add Farm"
              onPress={() => {
                navigation.navigate('AddFarm');
              }}
            />
            <AppButton
              label="AI Recommendation"
              mode="outline"
              onPress={() => {
                navigation.navigate('AIRecommendationForm');
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      refreshing={
        farmsQuery.isRefetching ||
        aiHistoryQuery.isRefetching ||
        analyticsFetchCount > 0 ||
        farmsFetchCount > 0 ||
        aiHistoryFetchCount > 0 ||
        weatherFetchCount > 0
      }
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
          Here is a quick snapshot of your farms, weather conditions, and recommendation activity.
        </Text>
      </View>

      <View className={isTwoColumn ? 'flex-row flex-wrap gap-md' : 'gap-md'}>
        <Pressable
          className="min-h-[92px] justify-center gap-xs rounded-md border px-md py-md"
          onPress={() => {
            navigation.navigate('AIRecommendationForm');
          }}
          style={[
            { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.outline },
          ]}
        >
          <Text variant="titleSmall">AI Recommendation</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Start a new crop recommendation
          </Text>
        </Pressable>

        <Pressable
          className="min-h-[92px] justify-center gap-xs rounded-md border px-md py-md"
          onPress={() => {
            navigation.navigate('Farms');
          }}
          style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        >
          <Text variant="titleSmall">My Farms</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            View and manage farm records
          </Text>
        </Pressable>

        <Pressable
          className="min-h-[92px] justify-center gap-xs rounded-md border px-md py-md"
          onPress={() => {
            navigation.navigate('WeatherDetails', { district: weatherCity });
          }}
          style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        >
          <Text variant="titleSmall">Weather</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Open weather details for your area
          </Text>
        </Pressable>

        <Pressable
          className="min-h-[92px] justify-center gap-xs rounded-md border px-md py-md"
          onPress={() => {
            navigation.navigate('Recommendations');
          }}
          style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
        >
          <Text variant="titleSmall">Recommendation History</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Review recent AI predictions
          </Text>
        </Pressable>
      </View>

      <WeatherCard city={weatherCity} />
      <FarmSummaryCard />
      <AIRecommendationCard />
      <DashboardCharts />
    </Screen>
  );
}

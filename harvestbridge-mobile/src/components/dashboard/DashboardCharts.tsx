import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import {
  ANALYTICS_AI_ENDPOINTS,
  getAnalyticsQueryKey,
  getFavoriteAnalytics,
  getMostRecommendedCrops,
  getRecommendationTrends,
} from '@/api/analytics.api';
import { FarmChart } from '@/components/dashboard/FarmChart';
import { RecommendationChart } from '@/components/dashboard/RecommendationChart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    return typeof status === 'number' ? status : undefined;
  }

  return undefined;
}

function formatPeriodLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
  }).format(date);
}

export function DashboardCharts() {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const trendsQuery = useQuery({
    queryKey: getAnalyticsQueryKey('trends'),
    queryFn: () => getRecommendationTrends({ granularity: 'month' }),
  });
  const cropDistributionQuery = useQuery({
    queryKey: getAnalyticsQueryKey('crops'),
    queryFn: () => getMostRecommendedCrops({ limit: 5 }),
  });
  const favoritesQuery = useQuery({
    queryKey: getAnalyticsQueryKey('favorites'),
    queryFn: getFavoriteAnalytics,
  });

  const missingEndpoints = [
    getErrorStatus(trendsQuery.error) === 404 ? ANALYTICS_AI_ENDPOINTS.trends : null,
    getErrorStatus(cropDistributionQuery.error) === 404
      ? ANALYTICS_AI_ENDPOINTS.mostRecommendedCrops
      : null,
    getErrorStatus(favoritesQuery.error) === 404 ? ANALYTICS_AI_ENDPOINTS.favorites : null,
  ].filter((value): value is string => Boolean(value));

  const nonMissingErrors = [
    trendsQuery.error && getErrorStatus(trendsQuery.error) !== 404
      ? getErrorMessage(trendsQuery.error)
      : null,
    cropDistributionQuery.error && getErrorStatus(cropDistributionQuery.error) !== 404
      ? getErrorMessage(cropDistributionQuery.error)
      : null,
    favoritesQuery.error && getErrorStatus(favoritesQuery.error) !== 404
      ? getErrorMessage(favoritesQuery.error)
      : null,
  ].filter((value): value is string => Boolean(value));

  const trends = trendsQuery.data ?? [];
  const recommendationHistoryLabels = trends.map((item) => formatPeriodLabel(item.period));
  const recommendationHistoryValues = trends.map((item) =>
    item.average_confidence <= 1
      ? Math.round(item.average_confidence * 100)
      : Math.round(item.average_confidence),
  );
  const monthlyPredictionValues = trends.map((item) => item.total);

  const cropDistribution = (cropDistributionQuery.data ?? []).map((item, index) => ({
    name: item.crop,
    value: item.total,
    color: ['#2F6B3E', '#6FA35D', '#A6D98A', '#9A6B2F', '#A9D6E5'][index % 5],
  }));

  const favoriteAnalytics = favoritesQuery.data;
  const favoriteChartData =
    favoriteAnalytics && favoriteAnalytics.total_recommendations > 0
      ? [
          {
            name: 'Favorites',
            value: favoriteAnalytics.favorite_recommendations,
            color: '#2F6B3E',
          },
          {
            name: 'Other',
            value:
              favoriteAnalytics.total_recommendations - favoriteAnalytics.favorite_recommendations,
            color: '#A9D6E5',
          },
        ].filter((item) => item.value > 0)
      : [];

  const favoriteHelperText =
    favoriteAnalytics && favoriteAnalytics.favorite_crops.length > 0
      ? `Top favorites: ${favoriteAnalytics.favorite_crops
          .slice(0, 3)
          .map((item) => `${item.crop} (${item.total})`)
          .join(', ')}`
      : 'Mark recommendations as favorites to build this chart.';

  const allQueriesEmpty =
    !trendsQuery.isLoading &&
    !cropDistributionQuery.isLoading &&
    !favoritesQuery.isLoading &&
    recommendationHistoryValues.length === 0 &&
    cropDistribution.length === 0 &&
    favoriteChartData.length === 0 &&
    missingEndpoints.length === 0 &&
    nonMissingErrors.length === 0;

  return (
    <View className="gap-md">
      {missingEndpoints.length > 0 ? (
        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
        >
          <Card.Content>
            <View className="gap-sm">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
                textStyle={{ color: theme.colors.error }}
              >
                Analytics Unavailable
              </Chip>
              <Text variant="titleMedium" style={{ color: theme.colors.error, fontWeight: '700' }}>
                Missing analytics endpoints
              </Text>
              {missingEndpoints.map((endpoint) => (
                <Text
                  key={endpoint}
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {endpoint}
                </Text>
              ))}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {nonMissingErrors.length > 0 ? (
        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
        >
          <Card.Content>
            <View className="gap-sm">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
                textStyle={{ color: theme.colors.error }}
              >
                Analytics Error
              </Chip>
              {nonMissingErrors.map((message, index) => (
                <Text
                  key={`${message}-${index}`}
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {message}
                </Text>
              ))}
            </View>
          </Card.Content>
        </Card>
      ) : null}

      {allQueriesEmpty ? (
        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
        >
          <Card.Content>
            <View className="gap-sm">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                Dashboard Charts
              </Chip>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                No analytics available yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Create recommendations and mark favorites to unlock dashboard charts.
              </Text>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <View className={isWide ? 'flex-row flex-wrap gap-md' : 'gap-md'}>
        <View className={isWide ? 'flex-1 basis-[48%]' : ''}>
          <RecommendationChart
            title="Recommendation History"
            subtitle="Average confidence over time"
            type="line"
            labels={recommendationHistoryLabels}
            values={recommendationHistoryValues}
            loading={trendsQuery.isLoading && !trendsQuery.data}
            errorMessage={
              getErrorStatus(trendsQuery.error) === 404
                ? 'Required analytics endpoint is unavailable.'
                : trendsQuery.isError
                  ? getErrorMessage(trendsQuery.error)
                  : undefined
            }
            emptyMessage="No recommendation trend data is available yet."
            formatValue={(value) => `${value}`}
          />
        </View>

        <View className={isWide ? 'flex-1 basis-[48%]' : ''}>
          <RecommendationChart
            title="Monthly Predictions"
            subtitle="Total predictions generated each month"
            type="bar"
            labels={recommendationHistoryLabels}
            values={monthlyPredictionValues}
            loading={trendsQuery.isLoading && !trendsQuery.data}
            errorMessage={
              getErrorStatus(trendsQuery.error) === 404
                ? 'Required analytics endpoint is unavailable.'
                : trendsQuery.isError
                  ? getErrorMessage(trendsQuery.error)
                  : undefined
            }
            emptyMessage="No monthly prediction data is available yet."
          />
        </View>

        <View className={isWide ? 'flex-1 basis-[48%]' : ''}>
          <FarmChart
            title="Crop Distribution"
            subtitle="Most frequently recommended crops"
            data={cropDistribution}
            loading={cropDistributionQuery.isLoading && !cropDistributionQuery.data}
            errorMessage={
              getErrorStatus(cropDistributionQuery.error) === 404
                ? 'Required analytics endpoint is unavailable.'
                : cropDistributionQuery.isError
                  ? getErrorMessage(cropDistributionQuery.error)
                  : undefined
            }
            emptyMessage="No crop distribution analytics are available yet."
          />
        </View>

        <View className={isWide ? 'flex-1 basis-[48%]' : ''}>
          <FarmChart
            title="Favorite Recommendations"
            subtitle="Favorites compared with total saved recommendations"
            data={favoriteChartData}
            helperText={favoriteHelperText}
            loading={favoritesQuery.isLoading && !favoritesQuery.data}
            errorMessage={
              getErrorStatus(favoritesQuery.error) === 404
                ? 'Required analytics endpoint is unavailable.'
                : favoritesQuery.isError
                  ? getErrorMessage(favoritesQuery.error)
                  : undefined
            }
            emptyMessage="No favorite recommendation analytics are available yet."
          />
        </View>
      </View>
    </View>
  );
}

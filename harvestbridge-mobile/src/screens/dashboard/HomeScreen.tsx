import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { getFarms } from '@/api/farm.api';
import { getPredictionHistory } from '@/api/recommendation.api';
import { getCurrentWeather } from '@/api/weather.api';
import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { APP_NAME, QUERY_STALE_TIME_MS } from '@/constants/app';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { designTokens } from '@/theme';
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

function formatRelativeDate(value?: string) {
  if (!value) {
    return 'No recent activity';
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatConfidence(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'No score';
  }

  return `${Math.round(value)}% confidence`;
}

function DashboardCard({
  title,
  subtitle,
  value,
  helper,
  accent,
}: {
  title: string;
  subtitle: string;
  value: string;
  helper: string;
  accent: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text variant="titleMedium">{title}</Text>
      <Text variant="headlineSmall" style={styles.cardValue}>
        {value}
      </Text>
      <Text variant="bodyMedium" style={[styles.cardSubtitle, { color: theme.colors.onSurface }]}>
        {subtitle}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {helper}
      </Text>
    </View>
  );
}

export function HomeScreen({ navigation }: AppTabScreenProps<'Home'>) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now);
  const currentDateLabel = formatDate(now);
  const weatherCity = user?.district?.trim() || undefined;
  const isTwoColumn = width >= 720;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'home', weatherCity ?? 'no-city'],
    staleTime: QUERY_STALE_TIME_MS,
    queryFn: async () => {
      const [farms, history, weather] = await Promise.all([
        getFarms(),
        getPredictionHistory(),
        weatherCity ? getCurrentWeather(weatherCity) : Promise.resolve(null),
      ]);

      return {
        farms,
        history,
        weather,
      };
    },
  });

  const farms = dashboardQuery.data?.farms ?? [];
  const history = dashboardQuery.data?.history ?? [];
  const weather = dashboardQuery.data?.weather ?? null;
  const latestRecommendation = history[0] ?? null;
  const averageConfidence = history.length
    ? Math.round(
        history.reduce(
          (total, item) => total + (Number(item.confidence) || 0),
          0,
        ) / history.length,
      )
    : null;

  const isEmpty =
    !dashboardQuery.isLoading &&
    farms.length === 0 &&
    history.length === 0 &&
    !weather;

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <LoadingState message="Loading your farmer dashboard..." />;
  }

  if (dashboardQuery.isError && !dashboardQuery.data) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message={getErrorMessage(dashboardQuery.error)}
        actionLabel="Reload dashboard"
        onAction={() => {
          void dashboardQuery.refetch();
        }}
      />
    );
  }

  if (isEmpty) {
    return (
      <Screen
        scrollable
        refreshing={dashboardQuery.isRefetching}
        onRefresh={() => {
          void dashboardQuery.refetch();
        }}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall">Your dashboard is ready</Text>
          <Text variant="bodyLarge" style={styles.emptyCopy}>
            Add your first farm or generate an AI recommendation to start filling the {APP_NAME}{' '}
            home dashboard.
          </Text>
          <View style={styles.emptyActions}>
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
      refreshing={dashboardQuery.isRefetching}
      onRefresh={() => {
        void dashboardQuery.refetch();
      }}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <Chip style={{ alignSelf: 'flex-start' }} compact>
          Farmer Dashboard
        </Chip>
        <Text variant="headlineMedium" style={styles.heroTitle}>
          {greeting}, {user?.name ?? 'Farmer'}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {currentDateLabel}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Here is a quick snapshot of your farms, weather conditions, and recommendation activity.
        </Text>
      </View>

      <View style={[styles.quickActions, isTwoColumn && styles.quickActionsWide]}>
        <Pressable
          onPress={() => {
            navigation.navigate('AIRecommendationForm');
          }}
          style={[
            styles.quickAction,
            { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.outline },
          ]}>
          <Text variant="titleSmall">AI Recommendation</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Start a new crop recommendation
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.navigate('Farms');
          }}
          style={[
            styles.quickAction,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}>
          <Text variant="titleSmall">My Farms</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            View and manage farm records
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.navigate('WeatherDetails', { district: weatherCity });
          }}
          style={[
            styles.quickAction,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}>
          <Text variant="titleSmall">Weather</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Open weather details for your area
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.navigate('Recommendations');
          }}
          style={[
            styles.quickAction,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}>
          <Text variant="titleSmall">Recommendation History</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Review recent AI predictions
          </Text>
        </Pressable>
      </View>

      <View style={[styles.cardsGrid, isTwoColumn && styles.cardsGridWide]}>
        <DashboardCard
          title="Weather Summary"
          value={
            weather
              ? `${Math.round(weather.temperature)} C`
              : weatherCity
                ? 'Unavailable'
                : 'No location'
          }
          subtitle={
            weather
              ? `${weather.humidity}% humidity with ${weather.rainfall} mm rainfall`
              : weatherCity
                ? `Weather for ${weatherCity} is not available yet`
                : 'Add a district to unlock weather data'
          }
          helper={weatherCity ? `Location: ${weatherCity}` : 'Profile district not set'}
          accent={theme.colors.primary}
        />

        <DashboardCard
          title="Farm Summary"
          value={`${farms.length}`}
          subtitle={farms.length === 1 ? 'farm recorded' : 'farms recorded'}
          helper={
            farms[0]
              ? `Latest: ${farms[0].farm_name} in ${farms[0].district}`
              : 'No farms added yet'
          }
          accent={theme.colors.secondary}
        />

        <DashboardCard
          title="AI Recommendation Summary"
          value={`${history.length}`}
          subtitle={history.length === 1 ? 'prediction saved' : 'predictions saved'}
          helper={
            averageConfidence !== null
              ? `Average confidence: ${averageConfidence}%`
              : 'Generate your first recommendation'
          }
          accent={theme.colors.tertiary ?? theme.colors.primary}
        />

        <DashboardCard
          title="Latest Recommendation"
          value={latestRecommendation?.recommended_crop ?? 'No result yet'}
          subtitle={
            latestRecommendation
              ? `${latestRecommendation.season} season in ${latestRecommendation.district}`
              : 'Your latest prediction will appear here'
          }
          helper={
            latestRecommendation
              ? `${formatConfidence(latestRecommendation.confidence)} | ${formatRelativeDate(latestRecommendation.created_at)}`
              : 'Use AI Recommendation to get started'
          }
          accent={theme.colors.error}
        />
      </View>

      {dashboardQuery.isError ? (
        <View
          style={[
            styles.inlineError,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.error,
            },
          ]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {getErrorMessage(dashboardQuery.error)}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
  },
  quickActions: {
    gap: designTokens.spacing.md,
  },
  quickActionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickAction: {
    borderWidth: 1,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs,
    minHeight: 92,
    justifyContent: 'center',
  },
  cardsGrid: {
    gap: designTokens.spacing.md,
  },
  cardsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.xs,
    minHeight: 164,
    flexBasis: '48%',
    flexGrow: 1,
  },
  accent: {
    width: 48,
    height: 6,
    borderRadius: designTokens.radius.pill,
    marginBottom: designTokens.spacing.xs,
  },
  cardValue: {
    fontWeight: '700',
  },
  cardSubtitle: {
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    gap: designTokens.spacing.md,
  },
  emptyCopy: {
    textAlign: 'center',
  },
  emptyActions: {
    gap: designTokens.spacing.md,
  },
  inlineError: {
    borderWidth: 1,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md,
  },
});

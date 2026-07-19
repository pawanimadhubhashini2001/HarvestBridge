import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { getStoryFeed, getStoryFeedQueryKey } from '@/api/story-feed.api';
import { getMyStoreQueryKey } from '@/api/store.api';
import { getCurrentWeatherQueryKey } from '@/api/weather.api';
import { FarmSummaryCard } from '@/components/dashboard/FarmSummaryCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { Screen } from '@/components/layout/screen';
import { StoriesRow } from '@/components/stories/StoriesRow';
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

export function HomeScreen({ navigation }: AppTabScreenProps<'Home'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now);
  const currentDateLabel = formatDate(now);
  const weatherCity = user?.district?.trim() || undefined;
  const isFarmer = user?.role === 'farmer';
  const storeQueryKey = getMyStoreQueryKey();
  const weatherQueryKey = getCurrentWeatherQueryKey(weatherCity);
  const storyFeedQueryKey = getStoryFeedQueryKey({
    sort: 'newest',
    per_page: 12,
  });
  const storeFetchCount = useIsFetching({ queryKey: storeQueryKey });
  const weatherFetchCount = useIsFetching({ queryKey: weatherQueryKey });
  const storyFeedFetchCount = useIsFetching({ queryKey: storyFeedQueryKey });
  const storyFeedQuery = useQuery({
    queryKey: storyFeedQueryKey,
    queryFn: () =>
      getStoryFeed({
        sort: 'newest',
        per_page: 12,
      }),
  });

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
      queryClient.refetchQueries({
        queryKey: storyFeedQueryKey,
        type: 'active',
      }),
    ]);
  };

  const stories = storyFeedQuery.data?.stories ?? [];

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={storeFetchCount > 0 || weatherFetchCount > 0 || storyFeedFetchCount > 0}
      onRefresh={() => {
        void handleRefresh();
      }}
    >
      <StoriesRow
        stories={stories}
        title="Stories"
        subtitle={
          isFarmer
            ? 'Browse fresh updates across HarvestBridge and share your own store story.'
            : 'Browse the latest active stories shared by farmer stores.'
        }
        actionLabel={isFarmer ? 'Add Story' : undefined}
        onActionPress={
          isFarmer
            ? () => {
                navigation.navigate('CreateStory');
              }
            : undefined
        }
        emptyStateMessage={
          isFarmer
            ? 'No active stories yet. Share an image or video update from your store to appear here.'
            : undefined
        }
        onStoryPress={(story) => {
          navigation.navigate('StoryFeed', {
            initialStoryId: story.id,
            sort: 'newest',
          });
        }}
        onViewAllPress={() => {
          navigation.navigate('StoryFeed', {
            sort: 'newest',
          });
        }}
      />

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

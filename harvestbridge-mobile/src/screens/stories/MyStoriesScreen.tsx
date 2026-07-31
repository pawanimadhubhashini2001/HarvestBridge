import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';

import {
  deleteStoreStory,
  getMyStoreStories,
  getMyStoreStoriesQueryKey,
  type StoreStoryDto,
} from '@/api/store-story.api';
import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { StoreStoryPreviewCard } from '@/components/store/StoreStoryPreviewCard';
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
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function MyStoriesScreen({ navigation }: AppStackScreenProps<'MyStories'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedStory, setSelectedStory] = useState<StoreStoryDto | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });

  const storiesQuery = useQuery({
    queryKey: getMyStoreStoriesQueryKey(),
    queryFn: getMyStoreStories,
    enabled: Boolean(storeQuery.data?.id),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (story: StoreStoryDto) => {
      const storeId = storeQuery.data?.id;

      if (!storeId) {
        throw new Error('Create your store profile before managing stories.');
      }

      await deleteStoreStory(storeId, story.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getMyStoreStoriesQueryKey() });
      setFeedbackMessage('Story deleted successfully.');
      setSelectedStory(null);
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const sortedStories = useMemo(
    () =>
      [...(storiesQuery.data ?? [])].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    [storiesQuery.data],
  );

  async function handleRefresh() {
    await Promise.all([storeQuery.refetch(), storiesQuery.refetch()]);
  }

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Loading your store stories..." />;
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
        message="Create your store profile before publishing temporary stories."
        actionLabel="Create Store"
        onAction={() => {
          navigation.replace('AddFarm');
        }}
      />
    );
  }

  const store = storeQuery.data;

  if (storiesQuery.isError && !storiesQuery.data) {
    return (
      <ErrorState
        title="Unable to load stories"
        message={getErrorMessage(storiesQuery.error)}
        actionLabel="Retry stories"
        onAction={() => {
          void storiesQuery.refetch();
        }}
      />
    );
  }

  return (
    <Screen
      scrollable
      refreshing={storiesQuery.isRefetching || storeQuery.isRefetching}
      onRefresh={() => {
        void handleRefresh();
      }}>
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Chip compact style={{ alignSelf: 'flex-start' }}>
          Store Stories
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          My Stories
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Promote fresh harvests, farm updates, and announcements. Stories expire automatically 24
          hours after posting.
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            navigation.navigate('CreateStory');
          }}>
          Create Story
        </Button>
      </View>

      {storiesQuery.isLoading && sortedStories.length === 0 ? (
        <LoadingState message="Loading active stories..." fullScreen={false} />
      ) : sortedStories.length === 0 ? (
        <View
          className="gap-md rounded-lg border px-lg py-xl"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            No active stories
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Your current story feed is empty. Add an image or video story to highlight products,
            farm activities, or store announcements.
          </Text>
          <Button
            mode="outlined"
            onPress={() => {
              navigation.navigate('CreateStory');
            }}>
            Add First Story
          </Button>
        </View>
      ) : (
        <View className="gap-lg">
          {sortedStories.map((story) => (
            <View key={story.id} className="gap-sm">
              <StoreStoryPreviewCard
                mediaType={story.media_type}
                mediaUrl={story.media_url}
                caption={story.caption}
                createdAtLabel={formatDateTime(story.created_at)}
                expiresAtLabel={formatDateTime(story.expires_at)}
                storeName={story.store?.store_name ?? store.store_name}
              />
              <View className="flex-row flex-wrap gap-sm">
                <Button
                  mode="contained-tonal"
                  onPress={() => {
                    navigation.navigate('CreateStory', { storyId: String(story.id) });
                  }}>
                  Edit Story
                </Button>
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  onPress={() => {
                    setSelectedStory(story);
                  }}>
                  Delete Story
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>

      <ConfirmationDialog
        visible={Boolean(selectedStory)}
        title="Delete Story?"
        message="This will permanently remove the selected story and its uploaded media."
        confirmLabel="Delete Story"
        cancelLabel="Cancel"
        loading={deleteStoryMutation.isPending}
        onCancel={() => {
          setSelectedStory(null);
        }}
        onConfirm={() => {
          if (!selectedStory) {
            return;
          }

          void deleteStoryMutation.mutateAsync(selectedStory);
        }}
      />
    </Screen>
  );
}

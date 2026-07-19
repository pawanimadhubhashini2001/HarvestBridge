import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';

import {
  createStoreStory,
  getMyStoreStories,
  getMyStoreStoriesQueryKey,
  updateStoreStory,
  type StoreStoryDto,
  type StoreStoryMediaAsset,
} from '@/api/store-story.api';
import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { StoreStoryPreviewCard } from '@/components/store/StoreStoryPreviewCard';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function getMediaFileName(uri: string, fallbackPrefix: string) {
  const parts = uri.split('/');
  const lastSegment = parts[parts.length - 1];

  return lastSegment || `${fallbackPrefix}-${Date.now()}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '24 hours after posting';
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

export function CreateStoryScreen({ navigation, route }: AppStackScreenProps<'CreateStory'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const storyId = route.params?.storyId;
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<StoreStoryMediaAsset | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
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

  const existingStory = useMemo(
    () =>
      storyId
        ? (storiesQuery.data ?? []).find((story) => String(story.id) === String(storyId)) ?? null
        : null,
    [storiesQuery.data, storyId],
  );

  useEffect(() => {
    if (!existingStory) {
      return;
    }

    setCaption(existingStory.caption ?? '');
  }, [existingStory]);

  const saveStoryMutation = useMutation({
    mutationFn: async () => {
      const storeId = storeQuery.data?.id;

      if (!storeId) {
        throw new Error('Create your store profile before publishing a story.');
      }

      const normalizedCaption = caption.trim();

      if (!existingStory && !selectedMedia) {
        throw new Error('Select an image or video before creating a story.');
      }

      if (existingStory) {
        return updateStoreStory(storeId, existingStory.id, {
          caption: normalizedCaption,
          media: selectedMedia,
        });
      }

      return createStoreStory(storeId, {
        caption: normalizedCaption,
        media: selectedMedia as StoreStoryMediaAsset,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getMyStoreStoriesQueryKey() });
      setFeedbackMessage(existingStory ? 'Story updated successfully.' : 'Story created successfully.');

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.replace('MyStories');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  async function handlePickMedia() {
    try {
      setValidationMessage(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Photo library permission is required to upload a story.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        allowsMultipleSelection: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const mediaType =
        asset.type === 'video' || asset.mimeType?.startsWith('video/')
          ? 'video'
          : 'image';

      setSelectedMedia({
        uri: asset.uri,
        name: asset.fileName ?? getMediaFileName(asset.uri, `story-${mediaType}`),
        type: asset.mimeType ?? (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        mediaType,
      });
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  }

  function handleSubmit() {
    if (!existingStory && !selectedMedia) {
      setValidationMessage('Select an image or video before publishing your story.');
      return;
    }

    setValidationMessage(null);
    void saveStoryMutation.mutateAsync();
  }

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Loading your store profile..." />;
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
        message="Create your store profile before creating stories."
        actionLabel="Create Store"
        onAction={() => {
          navigation.replace('AddFarm');
        }}
      />
    );
  }

  const store = storeQuery.data;

  if (storyId && storiesQuery.isLoading && !existingStory) {
    return <LoadingState message="Loading your story..." />;
  }

  if (storyId && !storiesQuery.isLoading && !existingStory) {
    return (
      <ErrorState
        title="Story unavailable"
        message="The selected story is no longer active or could not be found."
        actionLabel="Back to Stories"
        onAction={() => {
          navigation.replace('MyStories');
        }}
      />
    );
  }

  const previewStory = existingStory as StoreStoryDto | null;
  const previewMediaType = selectedMedia?.mediaType ?? previewStory?.media_type ?? 'image';
  const previewMediaUrl = selectedMedia?.uri ?? previewStory?.media_url ?? null;

  return (
    <Screen scrollable contentClassName="gap-lg">
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          {existingStory ? 'Edit Story' : 'Create Story'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Share a temporary image or video update from your store. Stories stay visible for 24
          hours from the time they are first posted.
        </Text>
      </View>

      <StoreStoryPreviewCard
        mediaType={previewMediaType}
        mediaUrl={previewMediaUrl}
        caption={caption}
        createdAtLabel={previewStory ? formatDateTime(previewStory.created_at) : 'Draft'}
        expiresAtLabel={previewStory ? formatDateTime(previewStory.expires_at) : '24 hours after posting'}
        storeName={store.store_name}
        fileName={selectedMedia?.name ?? null}
      />

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Story Content
        </Text>

        <Button
          mode="contained-tonal"
          loading={saveStoryMutation.isPending}
          disabled={saveStoryMutation.isPending}
          onPress={() => {
            void handlePickMedia();
          }}>
          {selectedMedia || previewStory ? 'Change Image or Video' : 'Choose Image or Video'}
        </Button>

        <HelperText type="info" visible>
          Supported story media: images up to 5 MB and videos up to 25 MB.
        </HelperText>

        <TextInput
          mode="outlined"
          label="Caption"
          value={caption}
          onChangeText={setCaption}
          maxLength={500}
          multiline
          numberOfLines={4}
          placeholder="Fresh harvest, limited stock, new activity, or a quick announcement..."
          disabled={saveStoryMutation.isPending}
        />
        <HelperText type="info" visible>
          {caption.trim().length}/500 characters
        </HelperText>
        <HelperText type="error" visible={Boolean(validationMessage)}>
          {validationMessage ?? ''}
        </HelperText>

        <View className="flex-row flex-wrap gap-sm">
          <Button
            mode="contained"
            loading={saveStoryMutation.isPending}
            disabled={saveStoryMutation.isPending}
            onPress={handleSubmit}>
            {existingStory ? 'Update Story' : 'Publish Story'}
          </Button>
          <Button
            mode="outlined"
            disabled={saveStoryMutation.isPending}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.replace('MyStories');
            }}>
            Cancel
          </Button>
        </View>
      </View>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useWindowDimensions, View } from 'react-native';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';

import {
  createStoreReview,
  getStoreReviews,
  getStoreReviewsQueryKey,
  updateStoreReview,
} from '@/api/store-review.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

const writeReviewSchema = z.object({
  rating: z
    .number({ invalid_type_error: 'Rating is required.' })
    .min(1, 'Rating must be at least 1.')
    .max(5, 'Rating must not be greater than 5.'),
  title: z
    .string()
    .trim()
    .min(1, 'Review title is required.')
    .max(120, 'Review title must be 120 characters or less.'),
  comment: z
    .string()
    .trim()
    .min(1, 'Review comment is required.')
    .max(1000, 'Review comment must be 1000 characters or less.'),
});

type WriteReviewFormValues = z.infer<typeof writeReviewSchema>;

function RatingButton({
  value,
  selected,
  disabled,
  onPress,
}: {
  value: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      mode={selected ? 'contained' : 'outlined'}
      compact
      disabled={disabled}
      onPress={onPress}>
      {value}
    </Button>
  );
}

export function WriteReviewScreen({
  navigation,
  route,
}: AppStackScreenProps<'WriteStoreReview'>) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const storeId = route.params?.storeId;
  const storeName = route.params?.storeName ?? 'Store';
  const reviewId = route.params?.reviewId;
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isNarrow = width < 390;
  const actionButtonStyle = isNarrow ? { flexGrow: 1 } : undefined;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<WriteReviewFormValues>({
    resolver: zodResolver(writeReviewSchema),
    defaultValues: {
      rating: 5,
      title: '',
      comment: '',
    },
  });

  const reviewsQuery = useQuery({
    queryKey: getStoreReviewsQueryKey(storeId ?? 'missing', { per_page: 20 }),
    queryFn: () => getStoreReviews(storeId ?? '', { per_page: 20 }),
    enabled: Boolean(storeId),
  });

  const reviewMutation = useMutation({
    mutationFn: async (values: WriteReviewFormValues) => {
      if (!storeId) {
        throw new Error('The selected store could not be identified.');
      }

      const existingReview = reviewsQuery.data?.current_user_review ?? null;

      if (existingReview) {
        return updateStoreReview(storeId, existingReview.id, values);
      }

      return createStoreReview(storeId, values);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['store', 'reviews', String(storeId)] }),
        queryClient.invalidateQueries({ queryKey: ['store', 'public', 'details', String(storeId)] }),
      ]);
      setFeedbackMessage(reviewId ? 'Your review was updated successfully.' : 'Your review was submitted successfully.');

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.replace('StoreReviews', {
        storeId,
        storeName,
      });
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  useEffect(() => {
    const existingReview = reviewsQuery.data?.current_user_review;

    if (!existingReview) {
      return;
    }

    reset({
      rating: existingReview.rating,
      title: existingReview.title,
      comment: existingReview.comment,
    });
  }, [reset, reviewsQuery.data?.current_user_review]);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not found"
        message="The selected store could not be identified."
      />
    );
  }

  if (user?.role !== 'consumer') {
    return (
      <ErrorState
        title="Reviews unavailable"
        message="Only authenticated consumers can write store reviews."
      />
    );
  }

  if (reviewsQuery.isLoading && !reviewsQuery.data) {
    return <LoadingState message="Loading your review form..." />;
  }

  if (reviewsQuery.isError && !reviewsQuery.data) {
    return (
      <ErrorState
        title="Unable to load review form"
        message={getErrorMessage(reviewsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void reviewsQuery.refetch();
        }}
      />
    );
  }

  return (
    <Screen scrollable contentClassName="gap-md">
      <View
        className="gap-sm rounded-lg border p-md"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
          {reviewsQuery.data?.current_user_review ? 'Edit Review' : 'Write Review'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Share your visit experience for {storeName}. Only one review is allowed per consumer for
          each store.
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border p-md"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="titleLarge" style={{ fontWeight: '700' }}>
          Rating
        </Text>

        <Controller
          control={control}
          name="rating"
          render={({ field: { value, onChange } }) => (
            <View className="flex-row flex-wrap gap-sm">
              {[1, 2, 3, 4, 5].map((ratingValue) => (
                <RatingButton
                  key={ratingValue}
                  value={ratingValue}
                  selected={value === ratingValue}
                  disabled={reviewMutation.isPending}
                  onPress={() => {
                    onChange(ratingValue);
                  }}
                />
              ))}
            </View>
          )}
        />
        <HelperText type="error" visible={Boolean(errors.rating?.message)}>
          {errors.rating?.message ?? ''}
        </HelperText>

        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              mode="outlined"
              label="Review Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={120}
              placeholder="Fresh produce and a friendly visit"
              disabled={reviewMutation.isPending}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.title?.message)}>
          {errors.title?.message ?? ''}
        </HelperText>

        <Controller
          control={control}
          name="comment"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              mode="outlined"
              label="Review Comment"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={5}
              maxLength={1000}
              placeholder="Describe the quality, communication, and overall experience."
              disabled={reviewMutation.isPending}
            />
          )}
        />
        <HelperText type="error" visible={Boolean(errors.comment?.message)}>
          {errors.comment?.message ?? ''}
        </HelperText>

        <View className="flex-row flex-wrap gap-sm pt-sm">
          <Button
            mode="contained"
            loading={reviewMutation.isPending || isSubmitting}
            disabled={reviewMutation.isPending}
            style={actionButtonStyle}
            contentStyle={{ minHeight: 44 }}
            onPress={handleSubmit((values) => {
              void reviewMutation.mutateAsync(values);
            })}>
            {reviewsQuery.data?.current_user_review ? 'Update Review' : 'Submit Review'}
          </Button>
          <Button
            mode="outlined"
            disabled={reviewMutation.isPending}
            style={actionButtonStyle}
            contentStyle={{ minHeight: 44 }}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.replace('StoreReviews', {
                storeId,
                storeName,
              });
            }}>
            {isDirty ? 'Cancel Changes' : 'Cancel'}
          </Button>
        </View>
      </View>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

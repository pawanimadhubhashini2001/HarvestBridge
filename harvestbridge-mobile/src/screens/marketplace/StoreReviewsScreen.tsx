import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text } from 'react-native-paper';

import {
  deleteStoreReview,
  getStoreReviews,
  getStoreReviewsQueryKey,
  type StoreReviewDto,
} from '@/api/store-review.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function formatRating(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'No ratings yet';
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} / 5`;
}

function renderStarRating(averageRating?: number | null) {
  if (typeof averageRating !== 'number' || !Number.isFinite(averageRating)) {
    return '☆☆☆☆☆';
  }

  const filledStars = Math.round(averageRating);

  return `${'★'.repeat(Math.max(0, Math.min(5, filledStars)))}${'☆'.repeat(
    Math.max(0, 5 - Math.max(0, Math.min(5, filledStars))),
  )}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function ReviewCard({
  review,
  title,
  onEdit,
  onDelete,
  showActions = false,
}: {
  review: StoreReviewDto;
  title?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
      <View className="gap-sm p-lg">
        {title ? (
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {title}
          </Text>
        ) : null}

        <View className="flex-row items-center gap-md">
          <View
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 44,
              height: 44,
              backgroundColor: theme.colors.surfaceVariant,
            }}>
            {review.reviewer?.profile_photo ? (
              <Image
                source={{ uri: review.reviewer.profile_photo }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {(review.reviewer?.name ?? 'U').slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>

          <View className="flex-1 gap-xs">
            <Text variant="titleSmall" style={{ fontWeight: '700' }}>
              {review.reviewer?.name ?? 'Anonymous customer'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Rated {review.rating}/5 on {formatDate(review.created_at)}
            </Text>
          </View>
        </View>

        <Text variant="titleMedium" style={{ fontWeight: '700' }}>
          {review.title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {review.comment}
        </Text>

        {showActions ? (
          <View className="flex-row flex-wrap gap-sm pt-sm">
            <Button mode="contained-tonal" onPress={onEdit}>
              Edit Review
            </Button>
            <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete}>
              Delete Review
            </Button>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export function StoreReviewsScreen({
  navigation,
  route,
}: AppStackScreenProps<'StoreReviews'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const storeId = route.params?.storeId;
  const storeName = route.params?.storeName ?? 'Store';
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isConsumer = user?.role === 'consumer';

  const reviewsQuery = useQuery({
    queryKey: getStoreReviewsQueryKey(storeId ?? 'missing', { per_page: 20 }),
    queryFn: () => getStoreReviews(storeId ?? '', { per_page: 20 }),
    enabled: Boolean(storeId),
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: number) => deleteStoreReview(storeId ?? '', reviewId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['store', 'reviews', String(storeId)] }),
        queryClient.invalidateQueries({ queryKey: ['store', 'public', 'details', String(storeId)] }),
      ]);
      setFeedbackMessage('Your review was deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  if (!storeId) {
    return (
      <ErrorState
        title="Store not found"
        message="The selected store could not be identified."
      />
    );
  }

  if (reviewsQuery.isLoading && !reviewsQuery.data) {
    return <LoadingState message="Loading store reviews..." />;
  }

  if (reviewsQuery.isError && !reviewsQuery.data) {
    return (
      <ErrorState
        title="Unable to load reviews"
        message={getErrorMessage(reviewsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void reviewsQuery.refetch();
        }}
      />
    );
  }

  const reviewData = reviewsQuery.data;

  if (!reviewData) {
    return (
      <ErrorState
        title="Reviews unavailable"
        message="Store reviews are not available right now."
      />
    );
  }

  const currentReview = reviewData.current_user_review ?? null;
  const otherReviews = currentReview
    ? reviewData.reviews.filter((review) => review.id !== currentReview.id)
    : reviewData.reviews;

  function handleDeleteReview(reviewId: number) {
    Alert.alert(
      'Delete review',
      'Are you sure you want to delete your review for this store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteMutation.mutateAsync(reviewId);
          },
        },
      ],
    );
  }

  return (
    <Screen
      scrollable
      refreshing={reviewsQuery.isRefetching}
      onRefresh={() => {
        void reviewsQuery.refetch();
      }}
      contentClassName="gap-lg">
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <View className="gap-md p-lg">
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
            {storeName} Reviews
          </Text>
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
            {renderStarRating(reviewData.summary.average_rating)}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Average rating: {formatRating(reviewData.summary.average_rating)}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {reviewData.summary.total_ratings} review
            {reviewData.summary.total_ratings === 1 ? '' : 's'}
          </Text>

          <Divider />

          <View className="gap-xs">
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              Rating Breakdown
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              5 Stars: {reviewData.summary.rating_breakdown.five_star_count}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              4 Stars: {reviewData.summary.rating_breakdown.four_star_count}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              3 Stars: {reviewData.summary.rating_breakdown.three_star_count}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              2 Stars: {reviewData.summary.rating_breakdown.two_star_count}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              1 Star: {reviewData.summary.rating_breakdown.one_star_count}
            </Text>
          </View>

          {isConsumer ? (
            <View className="flex-row flex-wrap gap-sm">
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('WriteStoreReview', {
                    storeId,
                    storeName,
                    reviewId: currentReview ? String(currentReview.id) : undefined,
                  });
                }}>
                {currentReview ? 'Edit Your Review' : 'Write Review'}
              </Button>
            </View>
          ) : null}
        </View>
      </Card>

      {currentReview ? (
        <ReviewCard
          review={currentReview}
          title="Your Review"
          showActions={isConsumer}
          onEdit={() => {
            navigation.navigate('WriteStoreReview', {
              storeId,
              storeName,
              reviewId: String(currentReview.id),
            });
          }}
          onDelete={() => {
            handleDeleteReview(currentReview.id);
          }}
        />
      ) : null}

      <View className="gap-md">
        <Text variant="titleLarge" style={{ fontWeight: '700' }}>
          Latest Reviews
        </Text>

        {otherReviews.length === 0 ? (
          <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
            <View className="gap-sm p-lg">
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                No reviews yet
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                This store has not received any customer reviews yet.
              </Text>
            </View>
          </Card>
        ) : (
          otherReviews.map((review, index) => (
            <View key={review.id} className="gap-md">
              {index > 0 ? <Divider /> : null}
              <ReviewCard review={review} />
            </View>
          ))
        )}
      </View>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

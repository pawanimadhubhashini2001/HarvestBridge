import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Chip, Divider, Snackbar, Text } from 'react-native-paper';

import {
  downloadRecommendationReport,
  getLatestSmartRecommendationResultQueryKey,
  getRecommendations,
  getRecommendationsQueryKey,
  toggleRecommendationFavorite,
  type CachedSmartRecommendationResult,
  type RecommendationHistoryDto,
} from '@/api/recommendation.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function formatConfidence(confidence: number) {
  const percent = confidence <= 1 ? confidence * 100 : confidence;

  return `${Math.round(percent)}%`;
}

function formatRecommendationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function SuccessHero({
  crop,
  confidence,
}: {
  crop: string;
  confidence: string;
}) {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.04,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.97,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.55,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [glow, scale]);

  return (
    <Card
      mode="outlined"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.outline,
        overflow: 'hidden',
      }}
    >
      <Card.Content>
        <View className="items-center gap-md px-md py-lg">
          <Animated.View
            style={{
              transform: [{ scale }],
              opacity: glow,
              position: 'absolute',
              top: 28,
              height: 144,
              width: 144,
              borderRadius: 999,
              backgroundColor: theme.colors.primaryContainer,
            }}
          />
          <Animated.View
            className="items-center justify-center rounded-full"
            style={{
              height: 108,
              width: 108,
              transform: [{ scale }],
              backgroundColor: theme.colors.primaryContainer,
            }}
          >
            <MaterialCommunityIcons
              name="sprout"
              size={52}
              color={theme.colors.primary}
            />
          </Animated.View>
          <Chip
            compact
            style={{ backgroundColor: theme.colors.secondaryContainer }}
            textStyle={{ color: theme.colors.secondary }}
          >
            Recommendation Ready
          </Chip>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {crop}
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Confidence: {confidence}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

function SummarySection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className="gap-xs">
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {children}
        </View>
      </Card.Content>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View className="flex-row items-start justify-between gap-md">
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurface, flex: 1.2, textAlign: 'right', fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );
}

function findMatchingRecommendation(
  cachedResult: CachedSmartRecommendationResult,
  recommendations: RecommendationHistoryDto[],
) {
  return recommendations.find((item) => {
    const matchesCrop =
      item.recommended_crop === cachedResult.response.prediction.recommended_crop;
    const matchesDistrict = item.district === cachedResult.request.District;
    const matchesSeason = item.season === cachedResult.request.Season;
    const matchesSoil = item.soil_type === cachedResult.request.Soil_Type;
    const matchesDemand = item.market_demand === cachedResult.request.Market_Demand;

    return matchesCrop && matchesDistrict && matchesSeason && matchesSoil && matchesDemand;
  });
}

export function RecommendationResultScreen({
  navigation,
}: AppStackScreenProps<'RecommendationResult'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const cachedResultQuery = useQuery({
    queryKey: getLatestSmartRecommendationResultQueryKey(),
    queryFn: async () => {
      const cached = queryClient.getQueryData<CachedSmartRecommendationResult>(
        getLatestSmartRecommendationResultQueryKey(),
      );

      if (!cached) {
        throw new Error('No smart recommendation result is available in cache.');
      }

      return cached;
    },
    staleTime: Infinity,
  });
  const recommendationsQuery = useQuery({
    queryKey: getRecommendationsQueryKey(),
    queryFn: getRecommendations,
    enabled: Boolean(cachedResultQuery.data),
  });

  const cachedResult = cachedResultQuery.data;
  const recommendations = useMemo(
    () => recommendationsQuery.data?.data ?? [],
    [recommendationsQuery.data],
  );
  const matchingRecommendation = useMemo(
    () =>
      cachedResult
        ? findMatchingRecommendation(cachedResult, recommendations)
        : undefined,
    [cachedResult, recommendations],
  );

  const favoriteMutation = useMutation({
    mutationFn: async (historyId: number | string) => toggleRecommendationFavorite(historyId),
    onSuccess: async () => {
      setFeedbackMessage(
        matchingRecommendation?.is_favorite
          ? 'Recommendation removed from favorites.'
          : 'Recommendation saved to favorites.',
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getRecommendationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['analytics', 'ai'] }),
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const handleRefresh = async () => {
    await Promise.all([
      cachedResultQuery.refetch(),
      recommendationsQuery.refetch(),
    ]);
  };

  const handleShare = async () => {
    if (!cachedResult) {
      setFeedbackMessage('No recommendation is available to share.');
      return;
    }

    const shareText = [
      `HarvestBridge Recommendation`,
      `Crop: ${cachedResult.response.prediction.recommended_crop}`,
      `Confidence: ${formatConfidence(cachedResult.response.prediction.confidence)}`,
      `District: ${cachedResult.request.District}`,
      `Season: ${cachedResult.request.Season}`,
      `Market Demand: ${cachedResult.request.Market_Demand}`,
    ].join('\n');

    try {
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  };

  const handleDownloadPdf = async () => {
    if (!cachedResult) {
      setFeedbackMessage('No recommendation is available for PDF export.');
      return;
    }

    if (Platform.OS !== 'web') {
      setFeedbackMessage('PDF download is available on web in this build.');
      return;
    }

    try {
      const blob = (await downloadRecommendationReport({
        input: cachedResult.request,
        weather: cachedResult.response.weather,
        prediction: cachedResult.response.prediction,
        market: cachedResult.response.market_price,
      })) as Blob;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'recommendation-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedbackMessage('Recommendation PDF download started.');
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  };

  if (cachedResultQuery.isLoading && !cachedResultQuery.data) {
    return <LoadingState message="Loading recommendation result..." />;
  }

  if (cachedResultQuery.isError || !cachedResult) {
    return (
      <ErrorState
        title="No recommendation result"
        message="Create a new smart recommendation first so this screen has cached result data to display."
        actionLabel="Create Recommendation"
        onAction={() => {
          navigation.replace('AIRecommendationForm');
        }}
      />
    );
  }

  const recommendationTime = matchingRecommendation?.created_at ?? cachedResult.submitted_at;
  const confidence = formatConfidence(cachedResult.response.prediction.confidence);
  const weather = cachedResult.response.weather;
  const isFavorite = Boolean(matchingRecommendation?.is_favorite);

  return (
    <Screen
      scrollable
      refreshing={cachedResultQuery.isRefetching || recommendationsQuery.isRefetching}
      onRefresh={() => {
        void handleRefresh();
      }}
      contentClassName="gap-lg"
    >
      <SuccessHero
        crop={cachedResult.response.prediction.recommended_crop}
        confidence={confidence}
      />

      <View className={isWide ? 'flex-row gap-md' : 'gap-md'}>
        <View style={{ flex: 1 }} className="gap-md">
          <SummarySection title="Recommendation Summary">
            <DetailRow
              label="Recommended Crop"
              value={cachedResult.response.prediction.recommended_crop}
            />
            <DetailRow label="Confidence Percentage" value={confidence} />
            <DetailRow label="Market Demand" value={cachedResult.request.Market_Demand} />
            <DetailRow label="Recommendation Time" value={formatRecommendationTime(recommendationTime)} />
            <DetailRow label="District" value={cachedResult.request.District} />
            <DetailRow label="Season" value={cachedResult.request.Season} />
          </SummarySection>

          <SummarySection title="Weather Summary">
            <DetailRow label="Temperature" value={`${weather.temperature} deg C`} />
            <DetailRow label="Humidity" value={`${weather.humidity}%`} />
            <DetailRow label="Rainfall" value={`${weather.rainfall} mm`} />
            <DetailRow
              label="Condition"
              value={weather.condition || 'Current conditions available'}
            />
            <DetailRow
              label="Location"
              value={weather.location || cachedResult.request.District}
            />
          </SummarySection>
        </View>

        <View style={{ flex: 1 }} className="gap-md">
          <SummarySection title="Soil Summary" subtitle={`Farm: ${cachedResult.farm.name}`}>
            <DetailRow label="Soil Type" value={cachedResult.request.Soil_Type} />
            <DetailRow label="Soil pH" value={`${cachedResult.form.soil_ph}`} />
            <DetailRow label="Nitrogen" value={`${cachedResult.form.nitrogen}`} />
            <DetailRow label="Phosphorus" value={`${cachedResult.form.phosphorus}`} />
            <DetailRow label="Potassium" value={`${cachedResult.form.potassium}`} />
            <DetailRow
              label="Additional Notes"
              value={cachedResult.form.additional_notes || 'Not provided'}
            />
          </SummarySection>

          <SummarySection
            title="Actions"
            subtitle="Follow-up actions using the current cached recommendation."
          >
            <View className="gap-sm">
              <Button
                mode="contained"
                onPress={() => {
                  setFeedbackMessage('Explainable AI details are not implemented in this lesson.');
                }}
              >
                View Explanation
              </Button>
              <Button mode="outlined" onPress={() => void handleDownloadPdf()}>
                Download PDF
              </Button>
              <Button
                mode="outlined"
                disabled={favoriteMutation.isPending}
                onPress={() => {
                  if (!matchingRecommendation) {
                    setFeedbackMessage(
                      'Saved recommendation history is not ready yet. Pull to refresh and try again.',
                    );
                    return;
                  }

                  void favoriteMutation.mutateAsync(matchingRecommendation.id);
                }}
              >
                {favoriteMutation.isPending
                  ? 'Saving...'
                  : isFavorite
                    ? 'Saved Favorite'
                    : 'Save Favorite'}
              </Button>
              <Button mode="outlined" onPress={() => void handleShare()}>
                Share Recommendation
              </Button>
              <Button
                mode="text"
                textColor={theme.colors.primary}
                onPress={() => {
                  navigation.replace('AIRecommendationForm');
                }}
              >
                Create New Recommendation
              </Button>
            </View>
          </SummarySection>
        </View>
      </View>

      <SummarySection title="Recommendation Status">
        {recommendationsQuery.isLoading && !recommendationsQuery.data ? (
          <View className="items-center gap-sm py-md">
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Syncing recommendation history...
            </Text>
          </View>
        ) : recommendationsQuery.isError ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {getErrorMessage(recommendationsQuery.error)}
          </Text>
        ) : (
          <View className="gap-sm">
            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{isFavorite ? 'Favorite Saved' : 'Not Favorited Yet'}</Chip>
              <Chip compact>{cachedResult.farm.district}</Chip>
              <Chip compact>{cachedResult.request.Season}</Chip>
            </View>
            <Divider />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Pull to refresh if you want to resync favorite state or other linked recommendation
              metadata from the backend.
            </Text>
          </View>
        )}
      </SummarySection>

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => {
          setFeedbackMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setFeedbackMessage(null);
          },
        }}
      >
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

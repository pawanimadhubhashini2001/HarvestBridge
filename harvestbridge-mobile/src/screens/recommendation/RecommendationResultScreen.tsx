import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Chip, Divider, Snackbar, Text } from 'react-native-paper';

import {
  getLatestSmartRecommendationResultQueryKey,
  getRecommendations,
  getRecommendationsQueryKey,
  toggleRecommendationFavorite,
  type CachedSmartRecommendationResult,
  type RecommendationReportPayload,
  type RecommendationHistoryDto,
} from '@/api/recommendation.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { ConfidenceMeter } from '@/components/recommendation/ConfidenceMeter';
import {
  ExplanationCard,
  type ExplanationSectionId,
} from '@/components/recommendation/ExplanationCard';
import { MarketPriceCard } from '@/components/recommendation/MarketPriceCard';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import {
  buildRecommendationPdfFileName,
  downloadRecommendationPdf,
  openRecommendationPdf,
  shareRecommendationPdf,
  type SavedRecommendationPdf,
} from '@/services/pdf.service';
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

function formatPdfProgress(progress: number | null) {
  if (progress === null) {
    return 'Preparing download...';
  }

  return `Downloading PDF... ${Math.round(progress * 100)}%`;
}

function SuccessHero({
  crop,
  confidence,
}: {
  crop: string;
  confidence: number;
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
          <ConfidenceMeter confidence={confidence} size={164} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Generated from your latest store location, soil, weather, and market inputs.
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

    return matchesCrop && matchesDistrict && matchesSeason && matchesSoil;
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
  const [expandedExplanationSection, setExpandedExplanationSection] =
    useState<ExplanationSectionId | null>(null);
  const [savedPdf, setSavedPdf] = useState<SavedRecommendationPdf | null>(null);
  const [pdfAction, setPdfAction] = useState<'download' | 'share' | 'view' | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
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

  const buildPdfPayload = (): RecommendationReportPayload | null => {
    if (!cachedResult) {
      return null;
    }

    return {
      input: cachedResult.request,
      weather: cachedResult.response.weather,
      prediction: cachedResult.response.prediction,
      market: cachedResult.response.market_price,
    };
  };

  const ensurePdfSaved = async (shouldSaveToDevice: boolean) => {
    const payload = buildPdfPayload();

    if (!payload || !cachedResult) {
      throw new Error('No recommendation is available for PDF export.');
    }

    const pdfFile = await downloadRecommendationPdf(payload, {
      fileName: buildRecommendationPdfFileName(
        cachedResult.response.prediction.recommended_crop,
        cachedResult.submitted_at,
      ),
      shouldSaveToDevice,
      onProgress: (progress) => {
        setPdfProgress(progress);
      },
    });

    setSavedPdf(pdfFile);

    return pdfFile;
  };

  const handleDownloadPdf = async () => {
    setPdfAction('download');
    setPdfProgress(0);
    try {
      await ensurePdfSaved(true);
      setFeedbackMessage('Recommendation PDF saved successfully.');
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    } finally {
      setPdfAction(null);
      setPdfProgress(null);
    }
  };

  const handleViewPdf = async () => {
    setPdfAction('view');
    setPdfProgress(0);
    try {
      const pdfFile = savedPdf ?? (await ensurePdfSaved(false));
      await openRecommendationPdf(pdfFile);
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    } finally {
      setPdfAction(null);
      setPdfProgress(null);
    }
  };

  const handleSharePdf = async () => {
    setPdfAction('share');
    setPdfProgress(0);
    try {
      const pdfFile = savedPdf ?? (await ensurePdfSaved(false));
      await shareRecommendationPdf(pdfFile);
      setFeedbackMessage('Recommendation PDF ready to share.');
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    } finally {
      setPdfAction(null);
      setPdfProgress(null);
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
  const weatherSummary = [
    `${weather.temperature} deg C`,
    `${weather.humidity}% humidity`,
    `${weather.rainfall} mm rainfall`,
    weather.condition,
  ]
    .filter(Boolean)
    .join(', ');

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
        confidence={cachedResult.response.prediction.confidence}
      />

      <View className={isWide ? 'flex-row gap-md' : 'gap-md'}>
        <View style={{ flex: 1 }} className="gap-md">
          <SummarySection title="Recommendation Summary">
            <DetailRow
              label="Recommended Crop"
              value={cachedResult.response.prediction.recommended_crop}
            />
            <DetailRow label="Confidence Percentage" value={confidence} />
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

          <MarketPriceCard
            recommendedCrop={cachedResult.response.prediction.recommended_crop}
            marketPrice={cachedResult.response.market_price}
            isRefreshing={cachedResultQuery.isRefetching || recommendationsQuery.isRefetching}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        </View>

        <View style={{ flex: 1 }} className="gap-md">
          <SummarySection title="Soil Summary" subtitle={`Store: ${cachedResult.store.name}`}>
            <DetailRow label="Soil Type" value={cachedResult.request.Soil_Type} />
            <DetailRow
              label="Previous Crop"
              value={cachedResult.form.previous_crop || 'Not provided'}
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
                  if (!cachedResult.response.prediction.explanation) {
                    setFeedbackMessage(
                      'Explainable AI details are not available for this recommendation yet.',
                    );
                    return;
                  }

                  setExpandedExplanationSection('overall');
                  setFeedbackMessage('Explainable AI details are available below.');
                }}
              >
                View Explanation
              </Button>
              <Button mode="outlined" onPress={() => void handleDownloadPdf()}>
                {pdfAction === 'download' ? 'Downloading PDF...' : 'Download PDF'}
              </Button>
              <Button mode="outlined" onPress={() => void handleViewPdf()}>
                {pdfAction === 'view' ? 'Opening PDF...' : 'View PDF'}
              </Button>
              <Button mode="outlined" onPress={() => void handleSharePdf()}>
                {pdfAction === 'share' ? 'Sharing PDF...' : 'Share PDF'}
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
              {pdfAction ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatPdfProgress(pdfProgress)}
                </Text>
              ) : null}
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

      <ExplanationCard
        explanation={cachedResult.response.prediction.explanation}
        recommendedCrop={cachedResult.response.prediction.recommended_crop}
        soilType={cachedResult.request.Soil_Type}
        season={cachedResult.request.Season}
        marketDemand={cachedResult.request.Market_Demand ?? 'Not provided'}
        district={cachedResult.request.District}
        weatherSummary={weatherSummary}
        confidence={cachedResult.response.prediction.confidence}
        refreshing={cachedResultQuery.isRefetching || recommendationsQuery.isRefetching}
        onRefresh={() => {
          void handleRefresh();
        }}
        expandedSection={expandedExplanationSection}
        onExpandedSectionChange={setExpandedExplanationSection}
      />

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
              <Chip compact>{cachedResult.store.district}</Chip>
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

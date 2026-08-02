import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Chip, Snackbar, Text } from 'react-native-paper';

import {
  getLatestSmartRecommendationResultQueryKey,
  getRecommendations,
  getRecommendationsQueryKey,
  toggleRecommendationFavorite,
  type CachedSmartRecommendationResult,
  type RankedRecommendationCandidate,
  type RecommendationReportPayload,
  type RecommendationHistoryDto,
} from '@/api/recommendation.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import {
  ExplanationCard,
  type ExplanationSectionId,
} from '@/components/recommendation/ExplanationCard';
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

function normalizeConfidence(confidence: number) {
  const percent = confidence <= 1 ? confidence * 100 : confidence;

  return Math.max(0, Math.min(100, percent));
}

function getConfidenceTone(confidence: number) {
  const percent = normalizeConfidence(confidence);

  if (percent >= 80) {
    return 'Strong match';
  }

  if (percent >= 55) {
    return 'Best available match';
  }

  return 'Review conditions';
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
  district,
  plantMonth,
}: {
  crop: string;
  confidence: number;
  district: string;
  plantMonth: string;
}) {
  const theme = useAppTheme();
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [scale]);

  return (
    <Card
      mode="outlined"
      style={{
        backgroundColor: theme.colors.primaryContainer,
        borderColor: theme.colors.primary,
        overflow: 'hidden',
      }}
    >
      <Card.Content>
        <View className="gap-md py-sm">
          <View className="flex-row items-center gap-sm">
            <Animated.View
              className="items-center justify-center rounded-full"
              style={{
                height: 58,
                width: 58,
                transform: [{ scale }],
                backgroundColor: theme.colors.surface,
              }}
            >
              <MaterialCommunityIcons
                name="sprout"
                size={32}
                color={theme.colors.primary}
              />
            </Animated.View>
            <View style={{ flex: 1 }} className="gap-xs">
              <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                Best Crop Match
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                {crop}
              </Text>
            </View>
          </View>

          <View
            className="gap-xs rounded-lg px-md py-md"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <View className="flex-row items-center justify-between gap-md">
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
                {formatConfidence(confidence)}
              </Text>
              <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {getConfidenceTone(confidence)}
              </Text>
            </View>
            <View
              className="overflow-hidden rounded-full"
              style={{ height: 10, backgroundColor: theme.colors.surfaceVariant }}
            >
              <View
                className="rounded-full"
                style={{
                  height: 10,
                  width: `${normalizeConfidence(confidence)}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            <Chip compact>{district}</Chip>
            <Chip compact>{plantMonth}</Chip>
          </View>
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
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
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

function AlternativeRecommendationCard({
  candidate,
  isPrimary,
  rank,
}: {
  candidate: RankedRecommendationCandidate;
  isPrimary: boolean;
  rank: number;
}) {
  const theme = useAppTheme();

  return (
    <View
      className="flex-row items-center gap-md rounded-lg border px-md py-md"
      style={{
        borderColor: isPrimary ? theme.colors.primary : theme.colors.outline,
        backgroundColor: isPrimary ? theme.colors.primaryContainer : theme.colors.surface,
      }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          height: 38,
          width: 38,
          backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceVariant,
        }}
      >
        <Text
          variant="titleSmall"
          style={{
            color: isPrimary ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
            fontWeight: '800',
          }}
        >
          {rank}
        </Text>
      </View>
      <View style={{ flex: 1 }} className="gap-xs">
        <View className="flex-row items-center justify-between gap-sm">
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: '800', flex: 1 }}
          >
            {candidate.name}
          </Text>
          <Chip compact>{formatConfidence(candidate.confidence)}</Chip>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {isPrimary ? 'Highest probability from the Random Forest model.' : 'Next best model match.'}
        </Text>
      </View>
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
    const matchesPlantMonth =
      (item.plant_month ?? item.season) === cachedResult.request.Plant_Month;

    return matchesCrop && matchesDistrict && matchesPlantMonth;
  });
}

export function RecommendationResultScreen({
  navigation,
}: AppStackScreenProps<'RecommendationResult'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
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
  const rankedRecommendations =
    cachedResult.response.prediction.recommended_crops?.length
      ? cachedResult.response.prediction.recommended_crops
      : [
          {
            name: cachedResult.response.prediction.recommended_crop,
            confidence: cachedResult.response.prediction.confidence,
          },
        ];
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
        district={cachedResult.request.District}
        plantMonth={cachedResult.request.Plant_Month}
      />

      <SummarySection
        title="Top 3 Recommended Crops"
        subtitle="The crops with the highest model probabilities for this district, month, soil pH, and weather."
      >
        <View className="gap-sm">
          {rankedRecommendations.map((candidate, index) => (
            <AlternativeRecommendationCard
              key={`${candidate.name}-${index}`}
              candidate={candidate}
              rank={index + 1}
              isPrimary={index === 0}
            />
          ))}
        </View>
      </SummarySection>

      <SummarySection title="Prediction Details">
        <DetailRow
          label="Recommended Crop"
          value={cachedResult.response.prediction.recommended_crop}
        />
        <DetailRow label="Confidence" value={confidence} />
        <DetailRow label="Generated" value={formatRecommendationTime(recommendationTime)} />
        <DetailRow label="Store" value={cachedResult.store.name} />
      </SummarySection>

      <SummarySection title="Input And Weather">
        <DetailRow label="District" value={cachedResult.request.District} />
        <DetailRow label="Planting Month" value={cachedResult.request.Plant_Month} />
        <DetailRow label="Soil pH" value={`${cachedResult.form.soil_ph}`} />
        <DetailRow label="Temperature" value={`${weather.temperature} deg C`} />
        <DetailRow label="Humidity" value={`${weather.humidity}%`} />
        <DetailRow label="Rainfall" value={`${weather.rainfall} mm`} />
        <DetailRow
          label="Condition"
          value={weather.condition || 'Current conditions available'}
        />
      </SummarySection>

      <SummarySection title="Actions">
        <View className="gap-sm">
          <Button
            mode="contained"
            icon="text-box-search-outline"
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
          <View className="flex-row gap-sm">
            <Button
              mode="outlined"
              icon="download"
              style={{ flex: 1 }}
              onPress={() => void handleDownloadPdf()}
            >
              {pdfAction === 'download' ? 'Downloading...' : 'PDF'}
            </Button>
            <Button
              mode="outlined"
              icon="share-variant"
              style={{ flex: 1 }}
              onPress={() => void handleSharePdf()}
            >
              {pdfAction === 'share' ? 'Sharing...' : 'Share'}
            </Button>
          </View>
          <View className="flex-row gap-sm">
            <Button
              mode="outlined"
              icon="file-eye-outline"
              style={{ flex: 1 }}
              onPress={() => void handleViewPdf()}
            >
              {pdfAction === 'view' ? 'Opening...' : 'View'}
            </Button>
            <Button
              mode="outlined"
              icon={isFavorite ? 'star' : 'star-outline'}
              style={{ flex: 1 }}
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
              {favoriteMutation.isPending ? 'Saving...' : isFavorite ? 'Saved' : 'Save'}
            </Button>
          </View>
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

      <ExplanationCard
        explanation={cachedResult.response.prediction.explanation}
        recommendedCrop={cachedResult.response.prediction.recommended_crop}
        soilType={`pH ${cachedResult.form.soil_ph}`}
        season={cachedResult.request.Plant_Month}
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

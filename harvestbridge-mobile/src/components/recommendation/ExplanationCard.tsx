import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Divider, List, Text } from 'react-native-paper';

import type { RecommendationExplanation, SmartPredictionResponse } from '@/api/recommendation.api';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ExplanationSectionId =
  | 'soil'
  | 'weather'
  | 'season'
  | 'market'
  | 'overall';

type ExplanationCardProps = {
  explanation?: SmartPredictionResponse['prediction']['explanation'];
  recommendedCrop: string;
  soilType: string;
  season: string;
  marketDemand: string;
  district: string;
  weatherSummary: string;
  confidence: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  errorMessage?: string | null;
  expandedSection?: ExplanationSectionId | null;
  onExpandedSectionChange?: (section: ExplanationSectionId | null) => void;
};

type ExplanationSection = {
  id: ExplanationSectionId;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  content: string;
  preview: string;
};

function clampConfidence(confidence: number) {
  const percent = confidence <= 1 ? confidence * 100 : confidence;

  return Math.max(0, Math.min(100, percent));
}

function normalizeExplanation(
  explanation?: SmartPredictionResponse['prediction']['explanation'],
) {
  if (!explanation) {
    return {};
  }

  if (typeof explanation === 'string') {
    return {
      overall: explanation,
    } as Partial<Record<ExplanationSectionId, string>>;
  }

  if (Array.isArray(explanation)) {
    const [soil, weather, season, market] = explanation;

    return {
      soil,
      weather,
      season,
      market,
    } as Partial<Record<ExplanationSectionId, string>>;
  }

  const record = explanation as RecommendationExplanation;

  return {
    soil: record.soil,
    weather: record.weather,
    season: record.season,
    market: record.market,
  } satisfies Partial<Record<ExplanationSectionId, string>>;
}

function buildOverallRecommendation({
  recommendedCrop,
  district,
  weatherSummary,
  season,
  marketDemand,
  confidence,
  fallbackExplanation,
}: {
  recommendedCrop: string;
  district: string;
  weatherSummary: string;
  season: string;
  marketDemand: string;
  confidence: number;
  fallbackExplanation?: string;
}) {
  const confidencePercent = Math.round(clampConfidence(confidence));
  const overview = `${recommendedCrop} is recommended for ${district} based on the latest soil, weather, seasonal, and market signals.`;
  const context = `${weatherSummary} supports the ${season} season outlook, while market demand is currently ${marketDemand}.`;
  const confidenceLine = `The model returned a confidence score of ${confidencePercent}%.`;

  return [overview, fallbackExplanation, context, confidenceLine]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');
}

function createPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim();

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

export function ExplanationCard({
  explanation,
  recommendedCrop,
  soilType,
  season,
  marketDemand,
  district,
  weatherSummary,
  confidence,
  refreshing = false,
  onRefresh,
  errorMessage,
  expandedSection,
  onExpandedSectionChange,
}: ExplanationCardProps) {
  const theme = useAppTheme();
  const entrance = useRef(new Animated.Value(0)).current;
  const [internalExpandedSection, setInternalExpandedSection] =
    useState<ExplanationSectionId | null>('overall');

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const explanationSections = useMemo(() => {
    const normalized = normalizeExplanation(explanation);
    const overallRecommendation =
      normalized.overall ??
      buildOverallRecommendation({
        recommendedCrop,
        district,
        weatherSummary,
        season,
        marketDemand,
        confidence,
        fallbackExplanation: normalized.soil,
      });

    const sections: ExplanationSection[] = [
      {
        id: 'soil',
        title: 'Soil Analysis',
        icon: 'sprout',
        content:
          normalized.soil ??
          `${soilType} soil data was used to evaluate how suitable the farm is for ${recommendedCrop}.`,
        preview:
          normalized.soil ??
          `${soilType} conditions were considered in the recommendation.`,
      },
      {
        id: 'weather',
        title: 'Weather Analysis',
        icon: 'weather-partly-cloudy',
        content:
          normalized.weather ??
          `Recent weather inputs were evaluated using ${weatherSummary}.`,
        preview:
          normalized.weather ??
          `Weather conditions were reviewed for the selected district.`,
      },
      {
        id: 'season',
        title: 'Season Analysis',
        icon: 'calendar-month',
        content:
          normalized.season ??
          `${season} season timing was used when ranking ${recommendedCrop}.`,
        preview:
          normalized.season ??
          `${season} seasonal timing influenced the recommendation.`,
      },
      {
        id: 'market',
        title: 'Market Analysis',
        icon: 'chart-line',
        content:
          normalized.market ??
          `Market demand was evaluated as ${marketDemand} for ${recommendedCrop}.`,
        preview:
          normalized.market ??
          `${marketDemand} market demand was included in the analysis.`,
      },
      {
        id: 'overall',
        title: 'Overall Recommendation',
        icon: 'lightbulb-on-outline',
        content: overallRecommendation,
        preview: createPreview(overallRecommendation),
      },
    ];

    return sections.map((section) => ({
      ...section,
      preview: createPreview(section.preview),
    }));
  }, [
    confidence,
    district,
    explanation,
    marketDemand,
    recommendedCrop,
    season,
    soilType,
    weatherSummary,
  ]);

  const hasAnyExplanation = useMemo(
    () =>
      explanationSections.some((section) => Boolean(section.content.trim())),
    [explanationSections],
  );
  const activeExpandedSection =
    expandedSection !== undefined ? expandedSection : internalExpandedSection;

  const setExpandedSection = (nextSection: ExplanationSectionId | null) => {
    if (expandedSection === undefined) {
      setInternalExpandedSection(nextSection);
    }

    onExpandedSectionChange?.(nextSection);
  };

  if (errorMessage) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={24}
                color={theme.colors.error}
              />
              <Text variant="titleMedium" style={{ color: theme.colors.error, fontWeight: '700' }}>
                Explainable AI unavailable
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {errorMessage}
            </Text>
            {onRefresh ? (
              <Button mode="outlined" onPress={onRefresh} loading={refreshing}>
                Retry
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!hasAnyExplanation) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="text-box-search-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                No explanation available
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              The latest smart recommendation did not include explainable AI details. Create a new
              recommendation or pull to refresh and try again.
            </Text>
            {onRefresh ? (
              <Button mode="outlined" onPress={onRefresh} loading={refreshing}>
                Refresh Explanation
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      <View className="gap-md">
        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
        >
          <Card.Content>
            <View className="gap-md">
              <View className="flex-row items-start justify-between gap-md">
                <View style={{ flex: 1 }} className="gap-xs">
                  <Text
                    variant="titleLarge"
                    style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                  >
                    Explainable AI
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Expand each card to see how soil, weather, season, and market signals shaped the
                    recommendation.
                  </Text>
                </View>
                {onRefresh ? (
                  <Button mode="text" compact onPress={onRefresh} loading={refreshing}>
                    Refresh
                  </Button>
                ) : null}
              </View>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Pull down on this screen to refresh the latest explanation data.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {explanationSections.map((section) => {
          const isExpanded = activeExpandedSection === section.id;

          return (
            <Card
              key={section.id}
              mode="outlined"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: isExpanded ? theme.colors.primary : theme.colors.outline,
              }}
            >
              <List.Accordion
                id={section.id}
                title={section.title}
                description={section.preview}
                expanded={isExpanded}
                onPress={() => {
                  setExpandedSection(isExpanded ? null : section.id);
                }}
                titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                style={{ backgroundColor: 'transparent' }}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={section.icon}
                        size={22}
                        color={isExpanded ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      />
                    )}
                  />
                )}
              >
                <Divider />
                <Card.Content>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {section.content}
                  </Text>
                </Card.Content>
              </List.Accordion>
            </Card>
          );
        })}
      </View>
    </Animated.View>
  );
}

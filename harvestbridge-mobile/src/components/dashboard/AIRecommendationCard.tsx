import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import {
  getPredictionHistory,
  getPredictionHistoryQueryKey,
  type PredictionHistoryDto,
} from '@/api/recommendation.api';
import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function SkeletonBlock({ height, width }: { height: number; width: number | string }) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        height,
        width,
        borderRadius: 999,
        backgroundColor: theme.colors.surfaceVariant,
      }}
    />
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View
      className="min-w-[140px] flex-1 gap-xs rounded-lg px-md py-sm"
      style={{ backgroundColor: theme.colors.surfaceVariant }}
    >
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

function toNumber(value: number | string) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatConfidence(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Not available';
  }

  const normalized = value <= 1 ? value * 100 : value;

  return `${Math.round(normalized)}%`;
}

function formatWeatherSummary(recommendation?: PredictionHistoryDto) {
  if (!recommendation) {
    return 'Weather inputs unavailable';
  }

  const temperature = toNumber(recommendation.temperature);
  const humidity = toNumber(recommendation.humidity);
  const rainfall = toNumber(recommendation.rainfall);

  const parts = [
    temperature !== null ? `${Math.round(temperature)} C` : null,
    humidity !== null ? `${Math.round(humidity)}% humidity` : null,
    rainfall !== null ? `${Math.round(rainfall)} mm rainfall` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Weather inputs unavailable';
}

function formatRecommendationDate(value?: string) {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function AIRecommendationCard() {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const historyQuery = useQuery({
    queryKey: getPredictionHistoryQueryKey(),
    queryFn: getPredictionHistory,
  });
  const latestRecommendation = historyQuery.data?.[0];
  const actionStackClassName = isWide ? 'flex-row gap-sm' : 'gap-sm';

  if (historyQuery.isLoading && !historyQuery.data) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              AI Recommendation
            </Chip>
            <View className="gap-sm">
              <SkeletonBlock height={34} width="42%" />
              <SkeletonBlock height={24} width="55%" />
              <SkeletonBlock height={20} width="65%" />
            </View>
            <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
              <SkeletonBlock height={76} width={isWide ? '48%' : '100%'} />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (historyQuery.isError) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.error }}
            >
              AI Recommendation
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: '700' }}>
              Unable to load recommendation history
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {getErrorMessage(historyQuery.error)}
            </Text>
            <View className={actionStackClassName}>
              <AppButton label="View Details" mode="outline" style={{ flex: 1 }} disabled />
              <AppButton
                label="New Recommendation"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('AIRecommendationForm');
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!latestRecommendation) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              AI Recommendation
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              No AI recommendations yet
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Run a new recommendation to see your latest crop suggestion, confidence, and weather inputs.
            </Text>
            <View className={actionStackClassName}>
              <AppButton label="View Details" mode="outline" style={{ flex: 1 }} disabled />
              <AppButton
                label="New Recommendation"
                style={{ flex: 1 }}
                onPress={() => {
                  navigation.navigate('AIRecommendationForm');
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className={isWide ? 'flex-row items-start justify-between gap-md' : 'gap-sm'}>
            <View className="flex-1 gap-xs">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                AI Recommendation
              </Chip>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {latestRecommendation.recommended_crop}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {latestRecommendation.season} season in {latestRecommendation.district}
              </Text>
            </View>

            <View
              className="gap-xs rounded-lg px-md py-sm"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Recommendation Date
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {formatRecommendationDate(latestRecommendation.created_at)}
              </Text>
            </View>
          </View>

          <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
            <SummaryMetric label="Confidence Score" value={formatConfidence(latestRecommendation.confidence)} />
            <SummaryMetric
              label="Market Demand"
              value={latestRecommendation.market_demand || 'Not provided'}
            />
            <SummaryMetric label="Weather Summary" value={formatWeatherSummary(latestRecommendation)} />
          </View>

          <View className={actionStackClassName}>
            <AppButton
              label="View Details"
              mode="outline"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('RecommendationDetails', {
                  recommendationId: String(latestRecommendation.id),
                });
              }}
            />
            <AppButton
              label="New Recommendation"
              style={{ flex: 1 }}
              onPress={() => {
                navigation.navigate('AIRecommendationForm');
              }}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

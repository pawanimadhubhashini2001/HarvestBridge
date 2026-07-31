import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';

import {
  getLatestDiseasePredictionQueryKey,
  type CachedDiseasePredictionResult,
} from '@/api/disease-detection.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';

function formatSubmittedAt(value: string) {
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

function formatConfidence(confidencePercentage: number) {
  return `${Math.round(confidencePercentage)}%`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
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

export function PlantDiseasePredictionScreen({
  navigation,
}: AppStackScreenProps<'PlantDiseasePrediction'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();

  const predictionQuery = useQuery({
    queryKey: getLatestDiseasePredictionQueryKey(),
    queryFn: async () => {
      const cached = queryClient.getQueryData<CachedDiseasePredictionResult>(
        getLatestDiseasePredictionQueryKey(),
      );

      if (!cached) {
        throw new Error('No plant disease prediction result is available in cache.');
      }

      return cached;
    },
    staleTime: Infinity,
  });

  if (predictionQuery.isLoading && !predictionQuery.data) {
    return <LoadingState message="Loading plant disease prediction..." />;
  }

  if (predictionQuery.isError || !predictionQuery.data) {
    return (
      <ErrorState
        title="No plant prediction result"
        message="Capture or upload a plant image first so this screen has prediction data to display."
        actionLabel="Start Detection"
        onAction={() => {
          navigation.replace('PlantDiseaseDetection');
        }}
      />
    );
  }

  const result = predictionQuery.data;

  return (
    <Screen scrollable contentClassName="gap-lg">
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.secondaryContainer }}
              textStyle={{ color: theme.colors.secondary }}
            >
              Prediction Ready
            </Chip>
            <Image
              source={{ uri: result.image.uri }}
              style={{
                width: '100%',
                height: 260,
                borderRadius: 18,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              contentFit="cover"
            />
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            >
              {result.response.disease_name}
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{formatConfidence(result.response.confidence_percentage)}</Chip>
              <Chip compact>{result.source === 'camera' ? 'Captured by Camera' : 'From Gallery'}</Chip>
              <Chip compact>{formatSubmittedAt(result.submitted_at)}</Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Prediction Details
            </Text>
            <InfoRow label="Disease Name" value={result.response.disease_name} />
            <InfoRow
              label="Confidence"
              value={formatConfidence(result.response.confidence_percentage)}
            />
            <Divider />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {result.response.description}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="medical-bag"
                size={22}
                color={theme.colors.primary}
              />
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                Treatment Suggestions
              </Text>
            </View>
            <View className="gap-sm">
              {result.response.treatment_suggestions.map((suggestion, index) => (
                <View key={`${index}-${suggestion}`} className="flex-row gap-sm">
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.primary, fontWeight: '700' }}
                  >
                    {index + 1}.
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
                  >
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-sm">
            <Button
              mode="contained"
              onPress={() => {
                navigation.replace('PlantDiseaseDetection');
              }}
            >
              Detect Another Plant
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                navigation.navigate('AIRecommendationForm');
              }}
            >
              Open Smart Recommendation
            </Button>
          </View>
        </Card.Content>
      </Card>
    </Screen>
  );
}

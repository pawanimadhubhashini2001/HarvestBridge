import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWindowDimensions, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import { getCurrentWeather, getCurrentWeatherQueryKey } from '@/api/weather.api';
import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

interface WeatherCardProps {
  city?: string;
}

interface WeatherMetricProps {
  label: string;
  value: string;
}

function formatTemperature(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return `${Math.round(value)} C`;
}

function formatMetric(value?: number | null, suffix = '') {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Not available';
  }

  return `${Math.round(value)}${suffix}`;
}

function formatRainProbability(probability?: number | null, rainfall?: number) {
  if (typeof probability === 'number' && !Number.isNaN(probability)) {
    return `${Math.round(probability)}%`;
  }

  if (typeof rainfall === 'number' && rainfall > 0) {
    return 'Rain detected';
  }

  return 'Not available';
}

function formatLastUpdated(lastUpdated?: string | null, fallbackTimestamp?: number) {
  const value =
    lastUpdated ?? (fallbackTimestamp ? new Date(fallbackTimestamp).toISOString() : null);

  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getWeatherCondition(params: {
  condition?: string | null;
  description?: string | null;
  rainfall?: number;
}) {
  if (params.description?.trim()) {
    return params.description;
  }

  if (params.condition?.trim()) {
    return params.condition;
  }

  if (typeof params.rainfall === 'number' && params.rainfall > 0) {
    return 'Rain showers';
  }

  return 'Current conditions unavailable';
}

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

function WeatherMetric({ label, value }: WeatherMetricProps) {
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

export function WeatherCard({ city }: WeatherCardProps) {
  const theme = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const weatherQuery = useQuery({
    queryKey: getCurrentWeatherQueryKey(city),
    queryFn: () => getCurrentWeather(city as string),
    enabled: Boolean(city),
  });

  const handleOpenDetails = () => {
    navigation.navigate('WeatherDetails', { district: city });
  };

  if (!city) {
    return (
      <Card
        mode="outlined"
        onPress={handleOpenDetails}
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.onSurfaceVariant }}
            >
              Weather
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Add your district to unlock live weather
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Pull down on the dashboard to refresh once your profile location is set.
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Tap to open Weather Details
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (weatherQuery.isLoading && !weatherQuery.data) {
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
              Live Weather
            </Chip>
            <View className="gap-sm">
              <SkeletonBlock height={40} width="45%" />
              <SkeletonBlock height={24} width="60%" />
              <SkeletonBlock height={18} width="38%" />
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

  if (weatherQuery.isError) {
    return (
      <Card
        mode="outlined"
        onPress={handleOpenDetails}
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.error }}
      >
        <Card.Content>
          <View className="gap-md">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.error }}
            >
              Weather Error
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: '700' }}>
              Unable to load live weather
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {getErrorMessage(weatherQuery.error)}
            </Text>
            <AppButton
              label="Retry"
              onPress={() => {
                void weatherQuery.refetch();
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  }

  const weather = weatherQuery.data;
  const condition = getWeatherCondition({
    condition: weather?.condition,
    description: weather?.condition_description,
    rainfall: weather?.rainfall,
  });
  const location = weather?.location?.trim() || city;
  const lastUpdated = formatLastUpdated(weather?.last_updated, weatherQuery.dataUpdatedAt);

  return (
    <Card
      mode="outlined"
      onPress={handleOpenDetails}
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className={isWide ? 'flex-row items-start justify-between gap-md' : 'gap-md'}>
            <View className="flex-1 gap-xs">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                Live Weather
              </Chip>
              <Text
                variant="headlineMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {formatTemperature(weather?.temperature)}
              </Text>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, textTransform: 'capitalize' }}
              >
                {condition}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {location}
              </Text>
            </View>

            <View
              className="gap-xs rounded-lg px-md py-sm"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Last Updated
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
              >
                {lastUpdated}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Pull down to refresh
              </Text>
            </View>
          </View>

          <View className={isWide ? 'flex-row flex-wrap gap-sm' : 'gap-sm'}>
            <WeatherMetric label="Humidity" value={formatMetric(weather?.humidity, '%')} />
            <WeatherMetric label="Wind Speed" value={formatMetric(weather?.wind_speed, ' m/s')} />
            <WeatherMetric
              label="Rain Probability"
              value={formatRainProbability(weather?.rain_probability, weather?.rainfall)}
            />
          </View>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Tap the card to open Weather Details
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

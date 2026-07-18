import { useWindowDimensions, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Card, Chip, Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';

interface RecommendationChartProps {
  title: string;
  subtitle: string;
  type: 'line' | 'bar';
  labels: string[];
  values: number[];
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
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

function formatLabel(label: string) {
  if (!label) {
    return '';
  }

  if (label.length <= 8) {
    return label;
  }

  return `${label.slice(0, 8)}...`;
}

export function RecommendationChart({
  title,
  subtitle,
  type,
  labels,
  values,
  loading = false,
  errorMessage,
  emptyMessage = 'No analytics available yet.',
  formatValue,
}: RecommendationChartProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const chartWidth = Math.max(280, Math.floor(isWide ? width / 2 - 48 : width - 64));

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      type === 'line' ? `rgba(47, 107, 62, ${opacity})` : `rgba(154, 107, 47, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(23, 49, 34, ${opacity})`,
    fillShadowGradient: type === 'line' ? 'rgba(47, 107, 62, 0.25)' : 'rgba(154, 107, 47, 0.25)',
    fillShadowGradientOpacity: 0.6,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.surface,
    },
    propsForBackgroundLines: {
      stroke: theme.colors.outline,
      strokeDasharray: '',
    },
    barPercentage: 0.7,
  };

  const chartData = {
    labels: labels.map(formatLabel),
    datasets: [
      {
        data: values.length > 0 ? values : [0],
      },
    ],
  };

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className="gap-xs">
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              Dashboard Chart
            </Chip>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              {title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          </View>

          {loading ? (
            <View className="gap-sm">
              <SkeletonBlock height={24} width="55%" />
              <SkeletonBlock height={220} width="100%" />
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View
              className="rounded-lg px-md py-md"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {!loading && !errorMessage && values.length === 0 ? (
            <View
              className="rounded-lg px-md py-md"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {emptyMessage}
              </Text>
            </View>
          ) : null}

          {!loading && !errorMessage && values.length > 0 ? (
            <View className="items-center overflow-hidden rounded-lg">
              {type === 'line' ? (
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  withInnerLines
                  withOuterLines={false}
                  withShadow
                  yAxisLabel=""
                  formatYLabel={formatValue}
                  fromZero
                  style={{ borderRadius: 16 }}
                />
              ) : (
                <BarChart
                  data={chartData}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars
                  yAxisLabel=""
                  formatYLabel={formatValue}
                  style={{ borderRadius: 16 }}
                />
              )}
            </View>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

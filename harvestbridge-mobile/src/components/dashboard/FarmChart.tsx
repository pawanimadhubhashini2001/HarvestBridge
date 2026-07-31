import { Platform, useWindowDimensions, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';

interface FarmChartSegment {
  name: string;
  value: number;
  color: string;
}

interface FarmChartProps {
  title: string;
  subtitle: string;
  data: FarmChartSegment[];
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  helperText?: string;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const chartKit = Platform.OS === 'web' ? null : require('react-native-chart-kit');
const PieChart = chartKit?.PieChart;

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

function WebFallbackPie({
  data,
}: {
  data: {
    name: string;
    population: number;
    color: string;
  }[];
}) {
  const theme = useAppTheme();
  const total = data.reduce((sum, item) => sum + item.population, 0);

  return (
    <View
      className="gap-sm rounded-lg px-md py-md"
      style={{ backgroundColor: theme.colors.surfaceVariant }}
    >
      {data.map((item) => {
        const percentage = total > 0 ? Math.round((item.population / total) * 100) : 0;

        return (
          <View key={item.name} className="gap-xs">
            <View className="flex-row items-center justify-between gap-sm">
              <View className="flex-row items-center gap-sm">
                <View
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.name}
                </Text>
              </View>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                {item.population} ({percentage}%)
              </Text>
            </View>
            <View
              className="h-3 overflow-hidden rounded-full"
              style={{ backgroundColor: theme.colors.outline }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(percentage, 8)}%`,
                  backgroundColor: item.color,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function FarmChart({
  title,
  subtitle,
  data,
  loading = false,
  errorMessage,
  emptyMessage = 'No analytics available yet.',
  helperText,
}: FarmChartProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const chartWidth = Math.max(280, Math.floor(isWide ? width / 2 - 48 : width - 64));

  const chartData = data.map((item) => ({
    name: item.name,
    population: item.value,
    color: item.color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

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
              <SkeletonBlock height={240} width="100%" />
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

          {!loading && !errorMessage && chartData.length === 0 ? (
            <View
              className="rounded-lg px-md py-md"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {emptyMessage}
              </Text>
            </View>
          ) : null}

          {!loading && !errorMessage && chartData.length > 0 && Platform.OS === 'web' ? (
            <WebFallbackPie data={chartData} />
          ) : null}

          {!loading &&
          !errorMessage &&
          chartData.length > 0 &&
          Platform.OS !== 'web' &&
          PieChart ? (
            <View className="items-center overflow-hidden rounded-lg">
              <PieChart
                data={chartData}
                width={chartWidth}
                height={220}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="12"
                absolute
                hasLegend
                chartConfig={{
                  color: (opacity = 1) => `rgba(23, 49, 34, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(23, 49, 34, ${opacity})`,
                }}
              />
            </View>
          ) : null}

          {helperText ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {helperText}
            </Text>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

import { useWindowDimensions, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
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

          {!loading && !errorMessage && chartData.length > 0 ? (
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

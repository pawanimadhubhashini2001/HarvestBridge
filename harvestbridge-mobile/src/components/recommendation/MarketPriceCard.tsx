import { ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';

import type { MarketPriceSnapshot } from '@/api/recommendation.api';
import { useAppTheme } from '@/hooks/use-app-theme';

type MarketPriceCardProps = {
  recommendedCrop: string;
  marketPrice?: MarketPriceSnapshot | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
  previousPricePerUnit?: number | string | null;
};

type TrendState = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  tone: string;
  helperText: string;
};

function parseNumericPrice(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatPrice(price: number | string) {
  const numericPrice = parseNumericPrice(price);

  if (numericPrice === null) {
    return String(price);
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
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
        style={{ color: theme.colors.onSurface, flex: 1.3, textAlign: 'right', fontWeight: '600' }}
      >
        {value}
      </Text>
    </View>
  );
}

function getTrendState(
  currentPrice: number | string,
  previousPricePerUnit?: number | string | null,
): TrendState {
  const current = parseNumericPrice(currentPrice);
  const previous = parseNumericPrice(previousPricePerUnit);

  if (current === null || previous === null) {
    return {
      icon: 'minus',
      label: 'Trend unavailable',
      tone: 'neutral',
      helperText: 'The current endpoint returns only the latest market price snapshot.',
    };
  }

  if (current > previous) {
    return {
      icon: 'trending-up',
      label: 'Price increasing',
      tone: 'positive',
      helperText: `Up from ${formatPrice(previous)} per unit.`,
    };
  }

  if (current < previous) {
    return {
      icon: 'trending-down',
      label: 'Price decreasing',
      tone: 'negative',
      helperText: `Down from ${formatPrice(previous)} per unit.`,
    };
  }

  return {
    icon: 'trending-neutral',
    label: 'Price steady',
    tone: 'neutral',
    helperText: 'No change from the previous market price snapshot.',
  };
}

export function MarketPriceCard({
  recommendedCrop,
  marketPrice,
  isLoading = false,
  isRefreshing = false,
  errorMessage,
  onRefresh,
  previousPricePerUnit,
}: MarketPriceCardProps) {
  const theme = useAppTheme();

  const isDataMalformed = Boolean(
    marketPrice &&
      (!marketPrice.market_name ||
        !marketPrice.district ||
        marketPrice.price_per_unit === undefined ||
        !marketPrice.unit ||
        !marketPrice.price_date),
  );

  if (isLoading && !marketPrice) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="items-center gap-sm py-md">
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Loading market price for {recommendedCrop}...
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if ((errorMessage || isDataMalformed) && !marketPrice) {
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
                Market price unavailable
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {errorMessage || 'The latest market price response is incomplete.'}
            </Text>
            {onRefresh ? (
              <Button mode="outlined" onPress={onRefresh} loading={isRefreshing}>
                Retry
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (!marketPrice) {
    return (
      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <View className="flex-row items-center gap-sm">
              <MaterialCommunityIcons
                name="store-search-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                No market price snapshot
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              The current smart recommendation response did not include a market price for
              {` ${recommendedCrop}`}.
            </Text>
            {onRefresh ? (
              <Button mode="outlined" onPress={onRefresh} loading={isRefreshing}>
                Refresh
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  }

  const trend = getTrendState(marketPrice.price_per_unit, previousPricePerUnit);
  const trendColor =
    trend.tone === 'positive'
      ? theme.colors.primary
      : trend.tone === 'negative'
        ? theme.colors.error
        : theme.colors.onSurfaceVariant;
  const cropName = marketPrice.crop || recommendedCrop;

  return (
    <Card
      mode="outlined"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: errorMessage || isDataMalformed ? theme.colors.error : theme.colors.outline,
      }}
    >
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row items-start justify-between gap-md">
            <View style={{ flex: 1 }} className="gap-xs">
              <View className="flex-row items-center gap-sm">
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                >
                  Market Price
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Latest backend market snapshot for the recommended crop.
              </Text>
            </View>
            {onRefresh ? (
              <Button mode="text" compact onPress={onRefresh} loading={isRefreshing}>
                Refresh
              </Button>
            ) : null}
          </View>

          {errorMessage || isDataMalformed ? (
            <View
              className="rounded-lg px-md py-sm"
              style={{ backgroundColor: theme.colors.errorContainer }}
            >
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {errorMessage || 'Market price data is incomplete. Displaying the last usable fields.'}
              </Text>
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-sm">
            <Chip compact>{cropName}</Chip>
            <Chip compact>{marketPrice.unit}</Chip>
            <Chip compact>{formatDate(marketPrice.price_date)}</Chip>
          </View>

          <View
            className="rounded-lg px-md py-md"
            style={{ backgroundColor: theme.colors.primaryContainer }}
          >
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              Price Per Unit
            </Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              {formatPrice(marketPrice.price_per_unit)}
            </Text>
          </View>

          <View className="flex-row items-center gap-sm">
            <MaterialCommunityIcons name={trend.icon} size={20} color={trendColor} />
            <View style={{ flex: 1 }} className="gap-xs">
              <Text variant="titleSmall" style={{ color: trendColor, fontWeight: '700' }}>
                {trend.label}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {trend.helperText}
              </Text>
            </View>
          </View>

          <Divider />

          <View className="gap-sm">
            <DetailRow label="Crop Name" value={cropName} />
            <DetailRow label="Market Name" value={marketPrice.market_name} />
            <DetailRow label="District" value={marketPrice.district} />
            <DetailRow label="Unit" value={marketPrice.unit} />
            <DetailRow label="Price Date" value={formatDate(marketPrice.price_date)} />
            <DetailRow label="Source" value={marketPrice.source || 'Not provided'} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

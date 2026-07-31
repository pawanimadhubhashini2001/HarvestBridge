import { View } from 'react-native';
import { Text } from 'react-native-paper';

import type { MarketplaceListingDto, NearbyProductSuggestionDto } from '@/api/marketplace.api';
import { useAppTheme } from '@/hooks/use-app-theme';

import { MarketplaceProductCard } from './MarketplaceProductCard';

type RecommendationItem = MarketplaceListingDto | NearbyProductSuggestionDto;

interface MarketplaceRecommendationSectionProps {
  title?: string;
  subtitle: string;
  items: RecommendationItem[];
  onItemPress: (item: RecommendationItem) => void;
  onCallPress: (item: RecommendationItem) => void;
  onDirectionsPress: (item: RecommendationItem) => void;
}

export function MarketplaceRecommendationSection({
  title = 'Recommended for You',
  subtitle,
  items,
  onItemPress,
  onCallPress,
  onDirectionsPress,
}: MarketplaceRecommendationSectionProps) {
  const theme = useAppTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="gap-md pt-sm">
      <View className="gap-xs">
        <Text variant="titleLarge" style={{ fontWeight: '700' }}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>
      </View>

      {items.map((item) => (
        <MarketplaceProductCard
          key={`recommendation-${item.id}`}
          item={item}
          compact
          onPress={() => {
            onItemPress(item);
          }}
          onCallPress={() => {
            onCallPress(item);
          }}
          onDirectionsPress={() => {
            onDirectionsPress(item);
          }}
        />
      ))}
    </View>
  );
}

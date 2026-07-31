import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';

export function RecommendationsScreen({ navigation }: AppTabScreenProps<'Recommendations'>) {
  const theme = useAppTheme();

  useEffect(() => {
    navigation.navigate('AIRecommendationForm');
  }, [navigation]);

  return (
    <View
      className="flex-1 items-center justify-center gap-md px-lg"
      style={{ backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        Opening smart recommendation...
      </Text>
    </View>
  );
}

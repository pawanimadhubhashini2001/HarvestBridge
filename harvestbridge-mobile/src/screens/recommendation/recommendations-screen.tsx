import type { AppTabScreenProps } from '@/navigation/types';
import { SmartRecommendationScreen } from '@/screens/recommendation/SmartRecommendationScreen';

export function RecommendationsScreen(props: AppTabScreenProps<'Recommendations'>) {
  return <SmartRecommendationScreen {...props} />;
}

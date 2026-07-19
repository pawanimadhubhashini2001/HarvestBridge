import type { AppTabScreenProps } from '@/navigation/types';
import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

export function RecommendationsScreen({ navigation }: AppTabScreenProps<'Recommendations'>) {
  return (
    <PlaceholderScreen
      title="AI Tools"
      badgeLabel="AI Module"
      description="Launch smart crop recommendations or scan a plant image for disease detection using the connected AI services."
      actions={[
        {
          label: 'New Recommendation',
          onPress: () => {
            navigation.navigate('AIRecommendationForm');
          },
        },
        {
          label: 'Plant Disease Detection',
          onPress: () => {
            navigation.navigate('PlantDiseaseDetection');
          },
        },
        {
          label: 'Latest Disease Prediction',
          mode: 'outline',
          onPress: () => {
            navigation.navigate('PlantDiseasePrediction');
          },
        },
      ]}
    />
  );
}

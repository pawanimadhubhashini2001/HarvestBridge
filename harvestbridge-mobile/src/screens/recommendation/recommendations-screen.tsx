import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

export function RecommendationsScreen() {
  return (
    <PlaceholderScreen
      title="Recommendations"
      badgeLabel="AI Module"
      description="AI recommendation history, saved predictions, and follow-up actions will be layered into this tab next."
      actions={[
        {
          label: 'New Recommendation',
        },
        {
          label: 'Favorites',
          mode: 'outline',
        },
      ]}
    />
  );
}

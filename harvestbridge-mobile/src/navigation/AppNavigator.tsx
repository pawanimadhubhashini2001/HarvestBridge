import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabs } from '@/navigation/BottomTabs';
import type { AppStackParamList } from '@/navigation/types';
import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

const Stack = createNativeStackNavigator<AppStackParamList>();

function StackPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <PlaceholderScreen title={title} description={description} />;
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FarmDetails"
        options={{ title: 'Farm Details' }}
        children={() => (
          <StackPlaceholder
            title="Farm Details"
            description="Prepared for viewing a specific farm record."
          />
        )}
      />
      <Stack.Screen
        name="AddFarm"
        options={{ title: 'Add Farm' }}
        children={() => (
          <StackPlaceholder
            title="Add Farm"
            description="Prepared for the farm creation flow."
          />
        )}
      />
      <Stack.Screen
        name="EditFarm"
        options={{ title: 'Edit Farm' }}
        children={() => (
          <StackPlaceholder
            title="Edit Farm"
            description="Prepared for updating farm information."
          />
        )}
      />
      <Stack.Screen
        name="RecommendationDetails"
        options={{ title: 'Recommendation Details' }}
        children={() => (
          <StackPlaceholder
            title="Recommendation Details"
            description="Prepared for recommendation detail viewing."
          />
        )}
      />
      <Stack.Screen
        name="AIRecommendationForm"
        options={{ title: 'AI Recommendation Form' }}
        children={() => (
          <StackPlaceholder
            title="AI Recommendation Form"
            description="Prepared for the AI recommendation request form."
          />
        )}
      />
      <Stack.Screen
        name="RecommendationResult"
        options={{ title: 'Recommendation Result' }}
        children={() => (
          <StackPlaceholder
            title="Recommendation Result"
            description="Prepared for displaying AI recommendation results."
          />
        )}
      />
      <Stack.Screen
        name="WeatherDetails"
        options={{ title: 'Weather Details' }}
        children={() => (
          <StackPlaceholder
            title="Weather Details"
            description="Prepared for detailed weather insights."
          />
        )}
      />
      <Stack.Screen
        name="Settings"
        options={{ title: 'Settings' }}
        children={() => (
          <StackPlaceholder
            title="Settings"
            description="Prepared for global app and account settings."
          />
        )}
      />
    </Stack.Navigator>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '@/hooks/use-app-theme';
import { BottomTabs } from '@/navigation/BottomTabs';
import type { AppStackParamList } from '@/navigation/types';
import { AddFarmScreen } from '@/screens/farms/AddFarmScreen';
import { EditFarmScreen } from '@/screens/farms/EditFarmScreen';
import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

const Stack = createNativeStackNavigator<AppStackParamList>();

function StackPlaceholder({
  title,
  description,
  badgeLabel,
}: {
  title: string;
  description: string;
  badgeLabel: string;
}) {
  return <PlaceholderScreen title={title} description={description} badgeLabel={badgeLabel} />;
}

export function AppNavigator() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FarmDetails"
        options={{ title: 'Farm Details' }}>
        {() => (
          <StackPlaceholder
            title="Farm Details"
            description="Prepared for viewing a specific farm record."
            badgeLabel="Farm Module"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AddFarm"
        component={AddFarmScreen}
        options={{ title: 'Add Farm' }}
      />
      <Stack.Screen
        name="EditFarm"
        component={EditFarmScreen}
        options={{ title: 'Edit Farm' }}
      />
      <Stack.Screen
        name="RecommendationDetails"
        options={{ title: 'Recommendation Details' }}>
        {() => (
          <StackPlaceholder
            title="Recommendation Details"
            description="Prepared for recommendation detail viewing."
            badgeLabel="AI Module"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AIRecommendationForm"
        options={{ title: 'AI Recommendation Form' }}>
        {() => (
          <StackPlaceholder
            title="AI Recommendation Form"
            description="Prepared for the AI recommendation request form."
            badgeLabel="AI Module"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="RecommendationResult"
        options={{ title: 'Recommendation Result' }}>
        {() => (
          <StackPlaceholder
            title="Recommendation Result"
            description="Prepared for displaying AI recommendation results."
            badgeLabel="AI Module"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="WeatherDetails"
        options={{ title: 'Weather Details' }}>
        {() => (
          <StackPlaceholder
            title="Weather Details"
            description="Prepared for detailed weather insights."
            badgeLabel="Weather"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Settings"
        options={{ title: 'Settings' }}>
        {() => (
          <StackPlaceholder
            title="Settings"
            description="Prepared for global app and account settings."
            badgeLabel="Account"
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

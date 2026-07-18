import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { FarmsScreen } from '@/screens/farms/farms-screen';
import { HomeScreen } from '@/screens/dashboard/HomeScreen';
import { NotificationsScreen } from '@/screens/notification/notifications-screen';
import { RecommendationsScreen } from '@/screens/recommendation/recommendations-screen';
import { ProfileScreen } from '@/screens/settings/profile-screen';
import type { AppTabParamList } from '@/navigation/types';
import { useAppTheme } from '@/hooks/use-app-theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function BottomTabs() {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Farms" component={FarmsScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

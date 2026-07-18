import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  const iconMap: Record<keyof AppTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Home: 'sprout',
    Farms: 'tractor-variant',
    Recommendations: 'chart-timeline-variant',
    Notifications: 'bell-ring-outline',
    Profile: 'account-circle-outline',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => (
          <MaterialCommunityIcons
            name={iconMap[route.name]}
            color={color}
            size={focused ? size + 2 : size}
          />
        ),
        tabBarItemStyle: {
          marginHorizontal: 2,
          borderRadius: 12,
        },
        tabBarActiveBackgroundColor: theme.colors.primaryContainer,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Farms" component={FarmsScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

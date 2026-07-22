import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { getMyOrders, getMyOrdersQueryKey } from '@/api/order.api';
import { FarmsScreen } from '@/screens/farms/farms-screen';
import { HomeScreen } from '@/screens/dashboard/HomeScreen';
import { useAuth } from '@/hooks/use-auth';
import { NotificationsScreen } from '@/screens/notification/notifications-screen';
import { MarketplaceScreen } from '@/screens/marketplace/MarketplaceScreen';
import { FavoritesScreen } from '@/screens/marketplace/FavoritesScreen';
import { MyOrdersScreen } from '@/screens/marketplace/MyOrdersScreen';
import { RecommendationsScreen } from '@/screens/recommendation/recommendations-screen';
import { ProfileScreen } from '@/screens/settings/profile-screen';
import type { AppTabParamList } from '@/navigation/types';
import { useAppTheme } from '@/hooks/use-app-theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const SEEN_ORDER_STATUS_UPDATES_STORAGE_KEY = 'orders-seen-status-updates';

export function BottomTabs() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const isConsumer = user?.role === 'consumer';
  const [seenOrderStatusUpdates, setSeenOrderStatusUpdates] = useState<string[]>([]);
  const consumerOrdersQuery = useQuery({
    queryKey: getMyOrdersQueryKey(),
    queryFn: getMyOrders,
    enabled: isConsumer,
    refetchInterval: 10000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    staleTime: 5000,
  });

  const actionedOrderStatusUpdates = useMemo(
    () =>
      consumerOrdersQuery.data
        ?.filter((order) => order.order_status === 'accepted' || order.order_status === 'rejected')
        .map((order) => `${order.id}:${order.order_status}`) ?? [],
    [consumerOrdersQuery.data],
  );
  const seenOrderStatusUpdateSet = useMemo(
    () => new Set(seenOrderStatusUpdates),
    [seenOrderStatusUpdates],
  );
  const orderUpdateCount = actionedOrderStatusUpdates.filter(
    (statusUpdateKey) => !seenOrderStatusUpdateSet.has(statusUpdateKey),
  ).length;
  const orderUpdateBadgeLabel = orderUpdateCount > 99 ? '99+' : String(orderUpdateCount);

  useEffect(() => {
    if (!isConsumer) {
      setSeenOrderStatusUpdates([]);
      return;
    }

    async function loadSeenOrderStatusUpdates() {
      const storedValue = await AsyncStorage.getItem(SEEN_ORDER_STATUS_UPDATES_STORAGE_KEY);

      if (!storedValue) {
        setSeenOrderStatusUpdates([]);
        return;
      }

      try {
        const parsedValue = JSON.parse(storedValue);
        setSeenOrderStatusUpdates(Array.isArray(parsedValue) ? parsedValue : []);
      } catch {
        setSeenOrderStatusUpdates([]);
      }
    }

    void loadSeenOrderStatusUpdates();
  }, [isConsumer]);

  const markOrderStatusUpdatesSeen = useCallback(() => {
    if (actionedOrderStatusUpdates.length === 0) {
      return;
    }

    const nextSeenOrderStatusUpdates = Array.from(
      new Set([...seenOrderStatusUpdates, ...actionedOrderStatusUpdates]),
    );

    setSeenOrderStatusUpdates(nextSeenOrderStatusUpdates);
    void AsyncStorage.setItem(
      SEEN_ORDER_STATUS_UPDATES_STORAGE_KEY,
      JSON.stringify(nextSeenOrderStatusUpdates),
    );
  }, [actionedOrderStatusUpdates, seenOrderStatusUpdates]);

  const iconMap: Record<keyof AppTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Home: 'sprout',
    Marketplace: 'storefront-outline',
    Favorites: 'heart-outline',
    MyOrders: 'clipboard-list-outline',
    Farms: 'storefront',
    Recommendations: 'chart-timeline-variant',
    Notifications: 'bell-ring-outline',
    Profile: 'account-circle-outline',
  };

  return (
    <Tab.Navigator
      initialRouteName={isConsumer ? 'Marketplace' : 'Home'}
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
        tabBarIcon: ({ color, size, focused }) => {
          const showOrderUpdateBadge = route.name === 'MyOrders' && orderUpdateCount > 0;

          return (
            <View style={{ minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons
                name={iconMap[route.name]}
                color={color}
                size={focused ? size + 2 : size}
              />
              {showOrderUpdateBadge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                    backgroundColor: theme.colors.error,
                    borderColor: theme.colors.surface,
                    borderWidth: 1,
                  }}>
                  <Text
                    style={{
                      color: theme.colors.onError,
                      fontSize: 10,
                      fontWeight: '700',
                      lineHeight: 12,
                    }}>
                    {orderUpdateBadgeLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        },
        tabBarItemStyle: {
          marginHorizontal: 2,
          borderRadius: 12,
        },
        tabBarActiveBackgroundColor: theme.colors.primaryContainer,
      })}>
      {isConsumer ? (
        <>
          <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
          <Tab.Screen name="Favorites" component={FavoritesScreen} />
          <Tab.Screen
            name="MyOrders"
            component={MyOrdersScreen}
            options={{
              tabBarLabel: 'Orders',
            }}
            listeners={{
              focus: markOrderStatusUpdatesSeen,
              tabPress: markOrderStatusUpdatesSeen,
            }}
          />
          <Tab.Screen name="Notifications" component={NotificationsScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen
            name="Farms"
            component={FarmsScreen}
            options={{ tabBarLabel: 'Store' }}
          />
          <Tab.Screen
            name="Recommendations"
            component={RecommendationsScreen}
            listeners={({ navigation }) => ({
              tabPress: (event) => {
                event.preventDefault();
                navigation.getParent()?.navigate('AIRecommendationForm');
              },
            })}
          />
          <Tab.Screen name="Notifications" component={NotificationsScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}

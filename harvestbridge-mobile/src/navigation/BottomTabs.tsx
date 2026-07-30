import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { getMyOrders, getMyOrdersQueryKey } from '@/api/order.api';
import { getPreOrderRequests, getPreOrderRequestsQueryKey } from '@/api/pre-order.api';
import { FarmsScreen } from '@/screens/farms/farms-screen';
import { HomeScreen } from '@/screens/dashboard/HomeScreen';
import { useAuth } from '@/hooks/use-auth';
import { NotificationsScreen } from '@/screens/notification/notifications-screen';
import { MarketplaceScreen } from '@/screens/marketplace/MarketplaceScreen';
import { FavoritesScreen } from '@/screens/marketplace/FavoritesScreen';
import { MyOrdersScreen } from '@/screens/marketplace/MyOrdersScreen';
import { ProductSearchMapScreen } from '@/screens/marketplace/ProductSearchMapScreen';
import { RecommendationsScreen } from '@/screens/recommendation/recommendations-screen';
import { ProfileScreen } from '@/screens/settings/profile-screen';
import type { AppTabParamList } from '@/navigation/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const SEEN_ORDER_STATUS_UPDATES_STORAGE_KEY = 'orders-seen-status-updates';
const ACTIONED_PRE_ORDER_STATUSES = new Set(['accepted', 'rejected', 'ready']);

export function BottomTabs() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const isConsumer = user?.role === 'consumer';
  const isNgo = user?.role === 'ngo';
  const isCompostBusiness = user?.role === 'compost_business';
  const usesMarketplaceTabs = isConsumer || isNgo || isCompostBusiness;
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
  const consumerPreOrderRequestsQuery = useQuery({
    queryKey: getPreOrderRequestsQueryKey(),
    queryFn: getPreOrderRequests,
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
        .map((order) => `order:${order.id}:${order.order_status}`) ?? [],
    [consumerOrdersQuery.data],
  );
  const actionedPreOrderStatusUpdates = useMemo(
    () =>
      consumerPreOrderRequestsQuery.data
        ?.filter((request) => ACTIONED_PRE_ORDER_STATUSES.has(request.status))
        .map((request) => `pre-order:${request.id}:${request.status}`) ?? [],
    [consumerPreOrderRequestsQuery.data],
  );
  const actionedStatusUpdates = useMemo(
    () => [...actionedOrderStatusUpdates, ...actionedPreOrderStatusUpdates],
    [actionedOrderStatusUpdates, actionedPreOrderStatusUpdates],
  );
  const seenOrderStatusUpdateSet = useMemo(
    () => new Set(seenOrderStatusUpdates),
    [seenOrderStatusUpdates],
  );
  const orderUpdateCount = actionedStatusUpdates.filter(
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
    if (actionedStatusUpdates.length === 0) {
      return;
    }

    const nextSeenOrderStatusUpdates = Array.from(
      new Set([...seenOrderStatusUpdates, ...actionedStatusUpdates]),
    );

    setSeenOrderStatusUpdates(nextSeenOrderStatusUpdates);
    void AsyncStorage.setItem(
      SEEN_ORDER_STATUS_UPDATES_STORAGE_KEY,
      JSON.stringify(nextSeenOrderStatusUpdates),
    );
  }, [actionedStatusUpdates, seenOrderStatusUpdates]);

  const iconMap: Record<keyof AppTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
    Home: 'sprout',
    Marketplace: 'storefront-outline',
    ProductSearch: 'magnify',
    Favorites: 'heart-outline',
    MyOrders: 'clipboard-list-outline',
    Farms: 'storefront',
    Recommendations: 'chart-timeline-variant',
    Notifications: 'bell-ring-outline',
    Profile: 'account-circle-outline',
  };

  return (
    <Tab.Navigator
      initialRouteName={usesMarketplaceTabs ? 'Marketplace' : 'Home'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          height: 76,
          paddingTop: designTokens.spacing.xs,
          paddingBottom: designTokens.spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          lineHeight: 16,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const showOrderUpdateBadge = route.name === 'MyOrders' && orderUpdateCount > 0;

          return (
            <View
              style={{
                minWidth: designTokens.touch.min,
                minHeight: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialCommunityIcons
                name={iconMap[route.name]}
                color={color}
                size={focused ? 26 : Math.max(size, 23)}
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
          marginHorizontal: 3,
          borderRadius: designTokens.radius.lg,
          minHeight: designTokens.touch.min,
        },
        tabBarActiveBackgroundColor: theme.colors.primaryContainer,
      })}>
      {usesMarketplaceTabs ? (
        <>
          <Tab.Screen
            name="Marketplace"
            component={MarketplaceScreen}
            options={{
              tabBarLabel: isNgo ? 'Donations' : isCompostBusiness ? 'Compost' : 'Market',
            }}
          />
          {isConsumer ? (
            <Tab.Screen
              name="ProductSearch"
              component={ProductSearchMapScreen}
              options={{ tabBarLabel: 'Search' }}
            />
          ) : null}
          {isConsumer ? (
            <Tab.Screen name="Favorites" component={FavoritesScreen} />
          ) : null}
          <Tab.Screen
            name="MyOrders"
            component={MyOrdersScreen}
            options={{
              tabBarLabel: 'Orders',
            }}
            listeners={
              isConsumer
                ? {
                    focus: markOrderStatusUpdatesSeen,
                    tabPress: markOrderStatusUpdatesSeen,
                  }
                : undefined
            }
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

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';

import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator } from '@/navigation/AppNavigator';
import { GuestRoute } from '@/navigation/GuestRoute';
import { ProtectedRoute } from '@/navigation/ProtectedRoute';
import { useAuth } from '@/hooks/use-auth';
import { linking } from '@/navigation/types';
import type { RootStackParamList } from '@/navigation/types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { SplashScreen } from '@/screens/auth/splash-screen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isHydrating } = useAuth();
  const theme = useAppTheme();

  useEffect(() => {
    if (!isHydrating) {
      void ExpoSplashScreen.hideAsync();
    }
  }, [isHydrating]);

  const navigationTheme = useMemo(
    () => ({
      dark: theme.dark,
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outline,
        notification: theme.colors.error,
      },
      fonts: theme.fonts,
    }),
    [theme],
  );

  if (isHydrating) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App">
            {() => (
              <ProtectedRoute fallback={<AuthNavigator initialRouteName="Login" />}>
                <AppNavigator />
              </ProtectedRoute>
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {() => (
              <GuestRoute fallback={<AppNavigator />}>
                <AuthNavigator initialRouteName="Login" />
              </GuestRoute>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

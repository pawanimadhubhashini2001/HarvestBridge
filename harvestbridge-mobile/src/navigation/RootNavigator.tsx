import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';

import { AuthNavigator } from '@/navigation/AuthNavigator';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useAuth } from '@/hooks/use-auth';
import { linking } from '@/navigation/types';
import type { RootStackParamList } from '@/navigation/types';
import { useAppTheme } from '@/hooks/use-app-theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isHydrating } = useAuth();
  const theme = useAppTheme();

  useEffect(() => {
    if (!isHydrating) {
      void SplashScreen.hideAsync();
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

  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth">
            {() => (
              <AuthNavigator
                key={isHydrating ? 'auth-hydrating' : 'auth-ready'}
                initialRouteName={isHydrating ? 'Splash' : 'Login'}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

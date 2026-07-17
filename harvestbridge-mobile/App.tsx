import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import { queryClient } from '@/api/query-client';
import { AuthProvider } from '@/contexts/auth-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/hooks/use-app-theme';

void SplashScreen.preventAutoHideAsync();

function AppProviders() {
  const theme = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <RootNavigator />
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default AppProviders;

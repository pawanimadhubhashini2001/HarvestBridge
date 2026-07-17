import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '@/screens/auth/forgot-password-screen';
import { LoginScreen } from '@/screens/auth/login-screen';
import { RegisterScreen } from '@/screens/auth/register-screen';
import { SplashScreen } from '@/screens/auth/splash-screen';
import type { AuthStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  initialRouteName?: keyof AuthStackParamList;
}

export function AuthNavigator({ initialRouteName = 'Login' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

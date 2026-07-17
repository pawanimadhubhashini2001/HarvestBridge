import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';
import type { AuthScreenProps } from '@/navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  return (
    <PlaceholderScreen
      title="Login"
      description="Authentication UI will be implemented in a future lesson. Navigation is ready."
      actions={[
        {
          label: 'Go to Register',
          mode: 'secondary',
          onPress: () => navigation.navigate('Register'),
        },
        {
          label: 'Forgot Password',
          mode: 'outline',
          onPress: () => navigation.navigate('ForgotPassword'),
        },
      ]}
    />
  );
}

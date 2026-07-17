import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';
import type { AuthScreenProps } from '@/navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  return (
    <PlaceholderScreen
      title="Register"
      description="Registration UI is intentionally deferred. This screen reserves the route and flow."
      actions={[
        {
          label: 'Back to Login',
          onPress: () => navigation.navigate('Login'),
        },
      ]}
    />
  );
}

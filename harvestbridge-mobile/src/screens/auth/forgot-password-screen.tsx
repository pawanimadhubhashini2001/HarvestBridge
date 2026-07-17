import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';
import type { AuthScreenProps } from '@/navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  return (
    <PlaceholderScreen
      title="Forgot Password"
      description="Password recovery UI is planned for a later lesson. The route is wired and typed."
      actions={[
        {
          label: 'Back to Login',
          mode: 'outline',
          onPress: () => navigation.navigate('Login'),
        },
      ]}
    />
  );
}

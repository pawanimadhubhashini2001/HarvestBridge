import { Text } from 'react-native-paper';

import { useAuth } from '@/hooks/use-auth';
import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

export function ProfileScreen() {
  const { user } = useAuth();

  return (
    <PlaceholderScreen
      title="Profile"
      description="Profile management will connect to the Laravel profile APIs in a later lesson."
      footer={
        user ? (
          <Text variant="bodyMedium">
            Authenticated user loaded from context: {user.name} ({user.role})
          </Text>
        ) : null
      }
    />
  );
}

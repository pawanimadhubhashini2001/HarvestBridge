import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';

export function SettingsScreen() {
  const { clearSession, user } = useAuth();
  const theme = useAppTheme();

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="gap-md rounded-lg border px-lg py-xl"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          Session Details
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Email: {user?.email ?? 'Not available'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          District: {user?.district ?? 'Not set'}
        </Text>
        <AppButton label="Logout" mode="outline" onPress={() => void clearSession()} />
      </View>
    </Screen>
  );
}

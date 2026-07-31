import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';

export function DashboardScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="gap-sm rounded-lg border px-lg py-xl"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Chip
          compact
          style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
          textStyle={{ color: theme.colors.primary }}>
          Overview
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          HarvestBridge
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Project setup is complete and ready for the next mobile lesson.
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Authenticated user: {user?.name ?? 'Unavailable'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Role: {user?.role ?? 'Unavailable'}
        </Text>
      </View>
    </Screen>
  );
}

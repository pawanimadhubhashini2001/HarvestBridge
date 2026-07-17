import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

export function DashboardScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();

  return (
    <Screen scrollable>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
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

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
});

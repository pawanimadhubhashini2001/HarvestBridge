import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = true,
}: LoadingStateProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: theme.colors.background },
      ]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onBackground }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.md,
    padding: designTokens.spacing.lg,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
  },
});

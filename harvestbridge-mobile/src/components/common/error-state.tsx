import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  actionLabel = 'Try again',
  onAction,
}: ErrorStateProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.error }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onBackground }]}>
        {message}
      </Text>
      {onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});

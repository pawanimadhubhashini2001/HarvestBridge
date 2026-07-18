import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { useAppTheme } from '@/hooks/use-app-theme';

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
    <View
      className="flex-1 items-center justify-center gap-md px-lg"
      style={{ backgroundColor: theme.colors.background }}>
      <Chip
        compact
        style={{ backgroundColor: theme.colors.surfaceVariant }}
        textStyle={{ color: theme.colors.error }}>
        Attention Needed
      </Chip>
      <Text variant="headlineSmall" style={{ color: theme.colors.error, textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
        {message}
      </Text>
      {onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

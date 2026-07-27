import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? () => undefined : onCancel}
        dismissable={!loading}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: designTokens.radius.xl,
        }}
      >
        <Dialog.Title style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onCancel}
            disabled={loading}
            contentStyle={{ minHeight: designTokens.touch.min }}>
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            contentStyle={{ minHeight: designTokens.touch.min }}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

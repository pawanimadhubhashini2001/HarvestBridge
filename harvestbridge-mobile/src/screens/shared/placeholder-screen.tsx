import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

type PlaceholderAction = {
  label: string;
  onPress?: () => void;
  mode?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
};

interface PlaceholderScreenProps {
  title: string;
  description: string;
  actions?: PlaceholderAction[];
  footer?: ReactNode;
}

export function PlaceholderScreen({
  title,
  description,
  actions = [],
  footer,
}: PlaceholderScreenProps) {
  const theme = useAppTheme();

  return (
    <Screen scrollable>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {description}
        </Text>

        <View style={styles.actions}>
          {actions.map((action) => (
            <AppButton
              key={action.label}
              label={action.label}
              onPress={action.onPress}
              mode={action.mode}
              disabled={action.disabled}
            />
          ))}
        </View>

        {footer}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
    minHeight: 280,
    justifyContent: 'center',
  },
  actions: {
    gap: designTokens.spacing.sm,
  },
});

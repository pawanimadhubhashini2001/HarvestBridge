import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';

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
  badgeLabel?: string;
}

export function PlaceholderScreen({
  title,
  description,
  actions = [],
  footer,
  badgeLabel = 'Coming Soon',
}: PlaceholderScreenProps) {
  const theme = useAppTheme();

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="min-h-[320px] gap-md rounded-lg border px-lg py-xl"
        style={[
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <Chip
          compact
          style={{
            alignSelf: 'flex-start',
            backgroundColor: theme.colors.primaryContainer,
          }}
          textStyle={{ color: theme.colors.primary }}>
          {badgeLabel}
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {description}
        </Text>

        <View className="gap-sm">
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

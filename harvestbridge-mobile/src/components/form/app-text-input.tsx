import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

type PaperTextInputProps = ComponentProps<typeof TextInput>;

interface AppTextInputProps extends Omit<PaperTextInputProps, 'mode'> {
  errorMessage?: string;
  containerClassName?: string;
}

export function AppTextInput({
  errorMessage,
  containerClassName,
  style,
  ...props
}: AppTextInputProps) {
  const theme = useAppTheme();

  return (
    <View className={containerClassName}>
      <TextInput
        mode="outlined"
        error={Boolean(errorMessage)}
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        placeholderTextColor={theme.colors.onSurfaceDisabled}
        style={[
          {
            backgroundColor: theme.colors.surface,
            minHeight: designTokens.touch.large,
          },
          style,
        ]}
        outlineStyle={{ borderRadius: designTokens.radius.md }}
        {...props}
      />
      <HelperText type="error" visible={Boolean(errorMessage)}>
        {errorMessage}
      </HelperText>
    </View>
  );
}

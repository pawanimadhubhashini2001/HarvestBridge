import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

type PaperTextInputProps = ComponentProps<typeof TextInput>;

interface AppTextInputProps extends Omit<PaperTextInputProps, 'mode'> {
  errorMessage?: string;
  containerClassName?: string;
}

export function AppTextInput({
  errorMessage,
  containerClassName,
  ...props
}: AppTextInputProps) {
  return (
    <View className={containerClassName}>
      <TextInput mode="outlined" error={Boolean(errorMessage)} {...props} />
      <HelperText type="error" visible={Boolean(errorMessage)}>
        {errorMessage}
      </HelperText>
    </View>
  );
}

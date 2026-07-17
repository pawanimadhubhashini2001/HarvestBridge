import type { ComponentProps } from 'react';
import { HelperText, TextInput } from 'react-native-paper';

type PaperTextInputProps = ComponentProps<typeof TextInput>;

interface AppTextInputProps extends Omit<PaperTextInputProps, 'mode'> {
  errorMessage?: string;
}

export function AppTextInput({ errorMessage, ...props }: AppTextInputProps) {
  return (
    <>
      <TextInput mode="outlined" error={Boolean(errorMessage)} {...props} />
      <HelperText type="error" visible={Boolean(errorMessage)}>
        {errorMessage}
      </HelperText>
    </>
  );
}

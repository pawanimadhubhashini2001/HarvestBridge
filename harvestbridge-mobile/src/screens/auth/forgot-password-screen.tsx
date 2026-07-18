import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { z } from 'zod';

import { forgotPassword } from '@/api/auth.api';
import { AppButton } from '@/components/common/app-button';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AuthScreenProps } from '@/navigation/types';
import type { AppError } from '@/types/api';

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const theme = useAppTheme();
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      reset();
    },
    onError: (error: AppError) => {
      const emailError = error.errors?.email;

      if (emailError) {
        setError('email', {
          message: Array.isArray(emailError) ? emailError[0] : emailError,
        });
      }
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync({
      email: values.email.trim(),
    });
  });

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="min-h-[360px] gap-lg rounded-lg border px-lg py-xl"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <View className="gap-sm">
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Forgot Password
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Enter your email address and we&apos;ll send you a password reset link.
          </Text>
        </View>

        <View className="gap-sm">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                containerClassName="gap-0"
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                errorMessage={errors.email?.message}
              />
            )}
          />

          {forgotPasswordMutation.isSuccess ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Reset instructions have been sent if the account exists and can receive email.
            </Text>
          ) : null}

          {forgotPasswordMutation.isError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {forgotPasswordMutation.error.message}
            </Text>
          ) : null}

          <AppButton
            label="Send Reset Email"
            onPress={() => void onSubmit()}
            loading={forgotPasswordMutation.isPending}
            disabled={!isValid || forgotPasswordMutation.isPending}
          />
        </View>

        <Divider />

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Login')}
          className="self-start">
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

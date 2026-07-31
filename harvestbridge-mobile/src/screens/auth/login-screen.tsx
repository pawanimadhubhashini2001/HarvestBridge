import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { Checkbox, Divider, Text, TextInput as PaperTextInput } from 'react-native-paper';
import { z } from 'zod';

import { requestLoginOtp, verifyLoginOtp } from '@/api/auth.api';
import { AppButton } from '@/components/common/app-button';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AuthScreenProps } from '@/navigation/types';
import { designTokens } from '@/theme';
import type { AppError } from '@/types/api';

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  otp: z.string().optional(),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginMutationVariables = LoginFormValues;

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const theme = useAppTheme();
  const { setSession, authError, clearAuthError } = useAuth();
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [otpSentToEmail, setOtpSentToEmail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      otp: '',
      rememberMe: true,
    },
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (values: LoginMutationVariables) =>
      requestLoginOtp({
        email: values.email.trim(),
        password: values.password,
      }),
    onSuccess: (_, variables) => {
      setApiError(null);
      setIsOtpStep(true);
      setOtpSentToEmail(variables.email.trim());
      setSuccessMessage('OTP sent to your email. Enter the code to finish login.');
    },
    onError: (error: AppError) => {
      setSuccessMessage(null);
      setApiError(error.message);

      const emailError = error.errors?.email;
      const passwordError = error.errors?.password;

      if (emailError) {
        setError('email', {
          message: Array.isArray(emailError) ? emailError[0] : emailError,
        });
      }

      if (passwordError) {
        setError('password', {
          message: Array.isArray(passwordError) ? passwordError[0] : passwordError,
        });
      }
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (values: LoginMutationVariables) =>
      verifyLoginOtp({
        email: values.email.trim(),
        otp: values.otp?.trim() ?? '',
      }),
    onSuccess: async (session, variables) => {
      clearAuthError();
      setApiError(null);
      setSuccessMessage(null);
      await setSession(session, { persist: variables.rememberMe });
    },
    onError: (error: AppError) => {
      setSuccessMessage(null);
      setApiError(error.message);

      const emailError = error.errors?.email;
      const otpError = error.errors?.otp;

      if (emailError) {
        setError('email', {
          message: Array.isArray(emailError) ? emailError[0] : emailError,
        });
      }

      if (otpError) {
        setError('otp', {
          message: Array.isArray(otpError) ? otpError[0] : otpError,
        });
      }
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearAuthError();
    setApiError(null);
    setSuccessMessage(null);

    if (isOtpStep && !values.otp?.trim()) {
      setError('otp', { message: 'OTP is required.' });
      return;
    }

    if (isOtpStep) {
      await verifyOtpMutation.mutateAsync(values);
      return;
    }

    await requestOtpMutation.mutateAsync(values);
  });

  const passwordValue = watch('password');
  const otpValue = watch('otp');
  const isSubmitting = requestOtpMutation.isPending || verifyOtpMutation.isPending;
  const canSubmit =
    isValid
    && !isSubmitting
    && (isOtpStep ? Boolean(otpValue?.trim()) : Boolean(passwordValue?.trim()));

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="gap-lg"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          borderRadius: designTokens.radius.xl,
          borderWidth: 1,
          minHeight: 420,
          paddingHorizontal: designTokens.spacing.xl,
          paddingVertical: designTokens.spacing['2xl'],
        }}>
        <View className="gap-sm">
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Sign in with your password, then verify the OTP sent to your email.
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
                disabled={isOtpStep || isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                containerClassName="gap-0"
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                errorMessage={errors.password?.message}
                disabled={isOtpStep || isSubmitting}
                right={
                  <PaperTextInput.Icon
                    icon={isPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setIsPasswordVisible((current) => !current)}
                  />
                }
              />
            )}
          />

          {isOtpStep ? (
            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppTextInput
                  containerClassName="gap-0"
                  label="Email OTP"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                  errorMessage={errors.otp?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          ) : null}

          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <Pressable
                className="-ml-2 flex-row items-center"
                onPress={() => onChange(!value)}>
                <Checkbox
                  status={value ? 'checked' : 'unchecked'}
                  onPress={() => onChange(!value)}
                />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Remember Me
                </Text>
              </Pressable>
            )}
          />

          {apiError ?? authError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {apiError ?? authError}
            </Text>
          ) : null}

          {successMessage ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              {successMessage}
            </Text>
          ) : null}

          <AppButton
            label={isOtpStep ? 'Verify OTP & Login' : 'Login'}
            onPress={() => void onSubmit()}
            loading={isSubmitting}
            disabled={!canSubmit}
          />

          {isOtpStep ? (
            <>
              <AppButton
                label="Resend OTP"
                mode="outline"
                onPress={() => void requestOtpMutation.mutateAsync({
                  email: otpSentToEmail ?? '',
                  password: passwordValue,
                  rememberMe: true,
                })}
                loading={requestOtpMutation.isPending}
                disabled={requestOtpMutation.isPending}
              />
              <AppButton
                label="Edit Login Details"
                mode="outline"
                onPress={() => {
                  setIsOtpStep(false);
                  setOtpSentToEmail(null);
                  setSuccessMessage(null);
                  setApiError(null);
                }}
                disabled={isSubmitting}
              />
            </>
          ) : null}
        </View>

        {!isOtpStep ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ForgotPassword')}
            className="self-start">
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        ) : null}

        <Divider />

        <View className="flex-row flex-wrap items-center gap-xs">
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Don&apos;t have an account?
          </Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('Register')}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

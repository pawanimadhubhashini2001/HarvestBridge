import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Checkbox, Divider, Text, TextInput as PaperTextInput } from 'react-native-paper';
import { z } from 'zod';

import { login } from '@/api/auth.api';
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
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginMutationVariables = LoginFormValues;

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const theme = useAppTheme();
  const { setSession } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginMutationVariables) =>
      login({
        email: values.email.trim(),
        password: values.password,
      }),
    onSuccess: async (session, variables) => {
      setApiError(null);
      await setSession(session, { persist: variables.rememberMe });
    },
    onError: (error: AppError) => {
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

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    await loginMutation.mutateAsync(values);
  });

  return (
    <Screen scrollable>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Sign in to continue to HarvestBridge.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                errorMessage={errors.password?.message}
                right={
                  <PaperTextInput.Icon
                    icon={isPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setIsPasswordVisible((current) => !current)}
                  />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <Pressable onPress={() => onChange(!value)} style={styles.checkboxRow}>
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

          {apiError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {apiError}
            </Text>
          ) : null}

          <AppButton
            label="Login"
            onPress={() => void onSubmit()}
            loading={loginMutation.isPending}
            disabled={!isValid || loginMutation.isPending}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.linkRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Divider />

        <View style={styles.footer}>
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

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.lg,
    minHeight: 420,
    justifyContent: 'center',
  },
  header: {
    gap: designTokens.spacing.sm,
  },
  form: {
    gap: designTokens.spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  linkRow: {
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    flexWrap: 'wrap',
  },
});

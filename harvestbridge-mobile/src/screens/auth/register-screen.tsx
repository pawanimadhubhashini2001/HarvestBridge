import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { Divider, RadioButton, Text, TextInput as PaperTextInput } from 'react-native-paper';
import { z } from 'zod';

//import { requestRegistrationOtp, verifyRegistrationOtp } from '@/api/auth.api';
import { register } from '@/api/auth.api';
import { AppButton } from '@/components/common/app-button';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AuthScreenProps } from '@/navigation/types';
import { designTokens } from '@/theme';
import type { AppError } from '@/types/api';
import type { UserRole } from '@/types/auth';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name is required.').max(255, 'Name is too long.'),
    email: z.email('Enter a valid email address.'),
    role: z.enum(['farmer', 'consumer', 'ngo', 'compost_business']),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z.string().min(1, 'Please confirm your password.'),
    otp: z.string().optional(),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterMutationVariables = RegisterFormValues;

const roleOptions: {
  value: Exclude<UserRole, 'admin'>;
  label: string;
}[] = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'ngo', label: 'NGO' },
  { value: 'compost_business', label: 'Compost Business' },
];

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const theme = useAppTheme();
  const { setSession } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      role: 'farmer',
      password: '',
      password_confirmation: '',
      otp: '',
    },
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  // const requestOtpMutation = useMutation({
  //   mutationFn: async (values: RegisterMutationVariables) =>
  //     requestRegistrationOtp({
  //       name: values.name.trim(),
  //       email: values.email.trim(),
  //       role: values.role,
  //       password: values.password,
  //       password_confirmation: values.password_confirmation,
  //     }),
  //   onSuccess: (_, variables) => {
  //     setApiError(null);
  //     setRegistrationEmail(variables.email.trim());
  //     setIsOtpStep(true);
  //     setSuccessMessage('OTP sent to your email. Enter the code to finish registration.');
  //   },
  //   onError: (error: AppError) => {
  //     setSuccessMessage(null);
  //     setApiError(error.message);

  //     const fields: (keyof RegisterFormValues)[] = [
  //       'name',
  //       'email',
  //       'role',
  //       'password',
  //       'password_confirmation',
  //     ];

  //     for (const field of fields) {
  //       const fieldError = error.errors?.[field];

  //       if (fieldError) {
  //         setError(field, {
  //           message: Array.isArray(fieldError) ? fieldError[0] : fieldError,
  //         });
  //       }
  //     }
  //   },
  // });

  // const verifyOtpMutation = useMutation({
  //   mutationFn: async (values: RegisterMutationVariables) =>
  //     verifyRegistrationOtp({
  //       email: registrationEmail ?? values.email.trim(),
  //       otp: values.otp?.trim() ?? '',
  //     }),
  //   onSuccess: async (session) => {
  //     setApiError(null);
  //     setSuccessMessage('Account verified successfully. Signing you in...');
  //     await setSession(session);
  //   },
  //   onError: (error: AppError) => {
  //     setSuccessMessage(null);
  //     setApiError(error.message);

  //     const emailError = error.errors?.email;
  //     const otpError = error.errors?.otp;

  //     if (emailError) {
  //       setError('email', {
  //         message: Array.isArray(emailError) ? emailError[0] : emailError,
  //       });
  //     }

  //     if (otpError) {
  //       setError('otp', {
  //         message: Array.isArray(otpError) ? otpError[0] : otpError,
  //       });
  //     }
  //   },
  // });

  const registerMutation = useMutation({
  mutationFn: async (values: RegisterMutationVariables) =>
    register({
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      password: values.password,
      password_confirmation: values.password_confirmation,
    }),
  onSuccess: async (session) => {
    setApiError(null);
    setSuccessMessage('Account created successfully. Signing you in...');
    await setSession(session);
  },
  onError: (error: AppError) => {
    setApiError(error.message);
  },
});

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccessMessage(null);

    // if (isOtpStep) {
    //   if (!values.otp?.trim()) {
    //     setError('otp', { message: 'OTP is required.' });
    //     return;
    //   }

    //   await verifyOtpMutation.mutateAsync(values);
    //   return;
    // }

    // await requestOtpMutation.mutateAsync(values);
    await registerMutation.mutateAsync(values);
  });

  const otpValue = watch('otp');
  // const isWorking = requestOtpMutation.isPending || verifyOtpMutation.isPending;
  const isWorking = registerMutation.isPending;

  return (
    <Screen scrollable contentClassName="justify-center">
      <View
        className="gap-lg"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          borderRadius: designTokens.radius.xl,
          borderWidth: 1,
          minHeight: 540,
          paddingHorizontal: designTokens.spacing.xl,
          paddingVertical: designTokens.spacing['2xl'],
        }}>
        <View className="gap-sm">
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            Create Account
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Create your account and verify your email with an OTP.
          </Text>
        </View>

        <View className="gap-sm">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                containerClassName="gap-0"
                label="Full Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                textContentType="name"
                errorMessage={errors.name?.message}
                disabled={isOtpStep || isWorking}
              />
            )}
          />

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
                disabled={isOtpStep || isWorking}
              />
            )}
          />

          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View className="gap-sm">
                <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                  Select Role
                </Text>
                <RadioButton.Group onValueChange={onChange} value={value}>
                  {roleOptions.map((option) => (
                    <Pressable
                      className="mb-xs border"
                      key={option.value}
                      disabled={isOtpStep || isWorking}
                      onPress={() => onChange(option.value)}
                      style={[
                        {
                          borderRadius: designTokens.radius.md,
                          minHeight: designTokens.touch.min,
                          borderColor:
                            value === option.value
                              ? theme.colors.primary
                              : theme.colors.outline,
                          backgroundColor:
                            value === option.value
                              ? theme.colors.secondaryContainer
                              : theme.colors.surface,
                        },
                      ]}>
                      <View className="flex-row items-center px-sm py-xs">
                        <RadioButton value={option.value} disabled={isOtpStep || isWorking} />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {option.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </RadioButton.Group>
                {errors.role?.message ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    {errors.role.message}
                  </Text>
                ) : null}
              </View>
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
                textContentType="newPassword"
                errorMessage={errors.password?.message}
                disabled={isOtpStep || isWorking}
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
            name="password_confirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextInput
                containerClassName="gap-0"
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                errorMessage={errors.password_confirmation?.message}
                disabled={isOtpStep || isWorking}
                right={
                  <PaperTextInput.Icon
                    icon={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setIsConfirmPasswordVisible((current) => !current)}
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
                  disabled={isWorking}
                />
              )}
            />
          ) : null}

          {apiError ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {apiError}
            </Text>
          ) : null}

          {successMessage ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              {successMessage}
            </Text>
          ) : null}

          <AppButton
            label={isOtpStep ? 'Verify OTP & Register' : 'Register'}
            onPress={() => void onSubmit()}
            loading={isWorking}
            disabled={!isValid || isWorking || (isOtpStep && !otpValue?.trim())}
          />

          {isOtpStep ? (
            <AppButton
              label="Edit Details"
              mode="outline"
              onPress={() => {
                setIsOtpStep(false);
                setRegistrationEmail(null);
                setSuccessMessage(null);
                setApiError(null);
              }}
              disabled={isWorking}
            />
          ) : null}
        </View>

        <Divider />

        <View className="flex-row flex-wrap items-center gap-xs">
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Already have an account?
          </Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('Login')}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

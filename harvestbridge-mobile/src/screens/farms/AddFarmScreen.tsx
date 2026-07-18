import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { z } from 'zod';

import {
  createFarm,
  getFarmsQueryKey,
  type FarmDto,
  type StoreFarmPayload,
} from '@/api/farm.api';
import { AppButton } from '@/components/common/app-button';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import type { AppError } from '@/types/api';

const optionalNumberSchema = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)), 'Enter a valid number.'),
]);

const addFarmSchema = z.object({
  farm_name: z
    .string()
    .trim()
    .min(1, 'Farm name is required.')
    .max(255, 'Farm name is too long.'),
  district: z
    .string()
    .trim()
    .min(1, 'District is required.')
    .max(100, 'District is too long.'),
  address: z.string().trim().min(1, 'Address is required.'),
  latitude: optionalNumberSchema,
  longitude: optionalNumberSchema,
  farm_size: z
    .string()
    .trim()
    .min(1, 'Farm size is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Farm size must be a number.')
    .refine((value) => Number(value) >= 0.1, 'Farm size must be at least 0.1.'),
  farm_size_unit: z.enum(['acres', 'hectares']),
  soil_type: z
    .string()
    .trim()
    .min(1, 'Soil type is required.')
    .max(100, 'Soil type is too long.'),
  description: z.string().trim().max(1000, 'Description is too long.').optional().or(z.literal('')),
});

type AddFarmFormValues = z.infer<typeof addFarmSchema>;

const farmSizeUnitOptions: StoreFarmPayload['farm_size_unit'][] = ['acres', 'hectares'];

function toCreateFarmPayload(values: AddFarmFormValues): StoreFarmPayload {
  return {
    farm_name: values.farm_name.trim(),
    district: values.district.trim(),
    address: values.address.trim(),
    farm_size: Number(values.farm_size),
    farm_size_unit: values.farm_size_unit,
    soil_type: values.soil_type.trim(),
    ...(values.latitude.trim() ? { latitude: Number(values.latitude) } : {}),
    ...(values.longitude.trim() ? { longitude: Number(values.longitude) } : {}),
    ...(values.description?.trim() ? { description: values.description.trim() } : {}),
  };
}

export function AddFarmScreen({ navigation }: AppStackScreenProps<'AddFarm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdFarmId, setCreatedFarmId] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<AddFarmFormValues>({
    defaultValues: {
      farm_name: '',
      district: '',
      address: '',
      latitude: '',
      longitude: '',
      farm_size: '',
      farm_size_unit: 'acres',
      soil_type: '',
      description: '',
    },
    resolver: zodResolver(addFarmSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (!createdFarmId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      navigation.replace('FarmDetails', { farmId: createdFarmId });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [createdFarmId, navigation]);

  const createFarmMutation = useMutation({
    mutationFn: async (values: StoreFarmPayload) => createFarm(values),
    onSuccess: async (createdFarm: FarmDto) => {
      setApiError(null);
      setSuccessMessage('Farm created successfully. Opening farm details...');
      queryClient.setQueryData<FarmDto[]>(getFarmsQueryKey(), (currentFarms) =>
        currentFarms ? [createdFarm, ...currentFarms] : [createdFarm],
      );
      await queryClient.invalidateQueries({ queryKey: getFarmsQueryKey() });
      await queryClient.refetchQueries({ queryKey: getFarmsQueryKey(), type: 'active' });
      setCreatedFarmId(String(createdFarm.id));
    },
    onError: (error: AppError) => {
      setSuccessMessage(null);
      setApiError(error.message);

      const fields: (keyof AddFarmFormValues)[] = [
        'farm_name',
        'district',
        'address',
        'latitude',
        'longitude',
        'farm_size',
        'farm_size_unit',
        'soil_type',
        'description',
      ];

      for (const field of fields) {
        const fieldError = error.errors?.[field];

        if (fieldError) {
          setError(field, {
            message: Array.isArray(fieldError) ? fieldError[0] : fieldError,
          });
        }
      }
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccessMessage(null);
    await createFarmMutation.mutateAsync(toCreateFarmPayload(values));
  });

  return (
    <Screen scrollable contentClassName="gap-lg">
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Chip
          compact
          style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
          textStyle={{ color: theme.colors.primary }}
        >
          Farm Module
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Add Farm
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Create a new farm using the current Laravel farm API validation rules.
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Controller
          control={control}
          name="farm_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Farm Name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              errorMessage={errors.farm_name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="district"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="District"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              errorMessage={errors.district?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              errorMessage={errors.address?.message}
            />
          )}
        />

        <View className="gap-sm">
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
            Farm Size Unit
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {farmSizeUnitOptions.map((unit) => (
              <Controller
                key={unit}
                control={control}
                name="farm_size_unit"
                render={({ field: { onChange, value } }) => (
                  <Pressable
                    className="rounded-md border px-md py-sm"
                    onPress={() => {
                      onChange(unit);
                    }}
                    style={{
                      borderColor: value === unit ? theme.colors.primary : theme.colors.outline,
                      backgroundColor:
                        value === unit ? theme.colors.secondaryContainer : theme.colors.surface,
                    }}
                  >
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: value === unit ? theme.colors.primary : theme.colors.onSurface,
                        fontWeight: value === unit ? '700' : '500',
                      }}
                    >
                      {unit === 'acres' ? 'Acres' : 'Hectares'}
                    </Text>
                  </Pressable>
                )}
              />
            ))}
          </View>
          {errors.farm_size_unit?.message ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>
              {errors.farm_size_unit.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="farm_size"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Farm Size"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              errorMessage={errors.farm_size?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="soil_type"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Soil Type"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              errorMessage={errors.soil_type?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="latitude"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Latitude (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              errorMessage={errors.latitude?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="longitude"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Longitude (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              errorMessage={errors.longitude?.message}
            />
          )}
        />

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          The current API may still return validation errors if latitude or longitude is omitted.
        </Text>

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppTextInput
              containerClassName="gap-0"
              label="Description (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              errorMessage={errors.description?.message}
            />
          )}
        />

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Description is collected here, but the current farm API does not explicitly validate or
          return it yet.
        </Text>

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

        <View className="flex-row gap-sm">
          <AppButton
            label="Cancel"
            mode="outline"
            className="flex-1"
            onPress={() => {
              navigation.goBack();
            }}
            disabled={createFarmMutation.isPending}
          />
          <AppButton
            label="Submit"
            className="flex-1"
            onPress={() => {
              void onSubmit();
            }}
            loading={createFarmMutation.isPending}
            disabled={!isValid || createFarmMutation.isPending}
          />
        </View>
      </View>
    </Screen>
  );
}

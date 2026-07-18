import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import {
  createFarm,
  getFarmsQueryKey,
  type FarmDto,
  type StoreFarmPayload,
} from '@/api/farm.api';
import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import {
  FarmFormFields,
  farmFormSchema,
  getDefaultFarmFormValues,
  toFarmPayload,
  type FarmFormValues,
} from '@/screens/farms/farm-form';
import type { AppError } from '@/types/api';

const farmFormFieldNames = [
  'farm_name',
  'district',
  'address',
  'latitude',
  'longitude',
  'farm_size',
  'farm_size_unit',
  'soil_type',
  'description',
] as const satisfies readonly (keyof FarmFormValues)[];

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
  } = useForm<FarmFormValues>({
    defaultValues: getDefaultFarmFormValues(),
    resolver: zodResolver(farmFormSchema),
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

      for (const field of farmFormFieldNames) {
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
    await createFarmMutation.mutateAsync(toFarmPayload(values));
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
        <FarmFormFields
          control={control}
          errors={errors}
          disabled={createFarmMutation.isPending}
          latitudeLabel="Latitude (optional)"
          longitudeLabel="Longitude (optional)"
          descriptionLabel="Description (optional)"
        />

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          The current API may still return validation errors if latitude or longitude is omitted.
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

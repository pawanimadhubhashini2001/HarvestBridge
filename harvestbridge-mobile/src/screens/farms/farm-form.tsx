import { Pressable, View } from 'react-native';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Text } from 'react-native-paper';
import { z } from 'zod';

import { type FarmDto, type StoreFarmPayload } from '@/api/farm.api';
import { AppTextInput } from '@/components/form/app-text-input';
import { useAppTheme } from '@/hooks/use-app-theme';

const optionalNumberSchema = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)), 'Enter a valid number.'),
]);

export const farmFormSchema = z.object({
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

export type FarmFormValues = z.infer<typeof farmFormSchema>;

export const farmSizeUnitOptions: StoreFarmPayload['farm_size_unit'][] = ['acres', 'hectares'];

function stringifyOptionalValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function getDefaultFarmFormValues(): FarmFormValues {
  return {
    farm_name: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    farm_size: '',
    farm_size_unit: 'acres',
    soil_type: '',
    description: '',
  };
}

export function toFarmFormValues(farm?: Partial<FarmDto>): FarmFormValues {
  const defaults = getDefaultFarmFormValues();

  if (!farm) {
    return defaults;
  }

  return {
    farm_name: farm.farm_name ?? defaults.farm_name,
    district: farm.district ?? defaults.district,
    address: farm.address ?? defaults.address,
    latitude: stringifyOptionalValue(farm.latitude),
    longitude: stringifyOptionalValue(farm.longitude),
    farm_size: stringifyOptionalValue(farm.farm_size),
    farm_size_unit: farm.farm_size_unit ?? defaults.farm_size_unit,
    soil_type: farm.soil_type ?? defaults.soil_type,
    description: farm.description ?? defaults.description,
  };
}

export function toFarmPayload(values: FarmFormValues): StoreFarmPayload {
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

export function FarmFormFields({
  control,
  errors,
  disabled = false,
  latitudeLabel = 'Latitude',
  longitudeLabel = 'Longitude',
  descriptionLabel = 'Description',
}: {
  control: Control<FarmFormValues>;
  errors: FieldErrors<FarmFormValues>;
  disabled?: boolean;
  latitudeLabel?: string;
  longitudeLabel?: string;
  descriptionLabel?: string;
}) {
  const theme = useAppTheme();

  return (
    <>
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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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
                  disabled={disabled}
                  style={{
                    borderColor: value === unit ? theme.colors.primary : theme.colors.outline,
                    backgroundColor:
                      value === unit ? theme.colors.secondaryContainer : theme.colors.surface,
                    opacity: disabled ? 0.7 : 1,
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
            disabled={disabled}
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
            disabled={disabled}
          />
        )}
      />

      <Controller
        control={control}
        name="latitude"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label={latitudeLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            errorMessage={errors.latitude?.message}
            disabled={disabled}
          />
        )}
      />

      <Controller
        control={control}
        name="longitude"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label={longitudeLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            errorMessage={errors.longitude?.message}
            disabled={disabled}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label={descriptionLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={4}
            errorMessage={errors.description?.message}
            disabled={disabled}
          />
        )}
      />
    </>
  );
}

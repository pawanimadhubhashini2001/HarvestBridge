import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { View } from 'react-native';
import { Controller, type Control, type FieldErrors, useWatch } from 'react-hook-form';
import { Button, Text } from 'react-native-paper';
import { z } from 'zod';

import { type StoreDto, type StoreImageAsset, type StorePayload } from '@/api/store.api';
import { AppTextInput } from '@/components/form/app-text-input';
import { useAppTheme } from '@/hooks/use-app-theme';

const optionalNumberSchema = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Number(value)), 'Enter a valid number.'),
]);

const storeImageSchema = z
  .object({
    uri: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
  })
  .nullable()
  .optional();

export const farmFormSchema = z
  .object({
    store_name: z
      .string()
      .trim()
      .min(1, 'Store name is required.')
      .max(255, 'Store name is too long.'),
    phone_number: z
      .string()
      .trim()
      .min(1, 'Phone number is required.')
      .max(30, 'Phone number is too long.'),
    district: z
      .string()
      .trim()
      .min(1, 'District is required.')
      .max(100, 'District is too long.'),
    address: z.string().trim().min(1, 'Address is required.'),
    latitude: optionalNumberSchema,
    longitude: optionalNumberSchema,
    store_description: z
      .string()
      .trim()
      .max(1000, 'Description is too long.')
      .optional()
      .or(z.literal('')),
    store_image: storeImageSchema,
    existing_store_image_url: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, context) => {
    const hasLatitude = values.latitude.trim().length > 0;
    const hasLongitude = values.longitude.trim().length > 0;

    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['latitude'],
        message: 'Latitude and longitude must be provided together.',
      });
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['longitude'],
        message: 'Latitude and longitude must be provided together.',
      });
    }
  });

export type FarmFormValues = z.infer<typeof farmFormSchema>;

function stringifyOptionalValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function getImageFileName(uri: string, fallbackPrefix: string) {
  const uriSegments = uri.split('/');
  const lastSegment = uriSegments[uriSegments.length - 1];

  if (lastSegment) {
    return lastSegment;
  }

  return `${fallbackPrefix}-${Date.now()}.jpg`;
}

export function getDefaultFarmFormValues(): FarmFormValues {
  return {
    store_name: '',
    phone_number: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    store_description: '',
    store_image: null,
    existing_store_image_url: '',
  };
}

export function toFarmFormValues(store?: Partial<StoreDto>): FarmFormValues {
  const defaults = getDefaultFarmFormValues();

  if (!store) {
    return defaults;
  }

  return {
    store_name: store.store_name ?? defaults.store_name,
    phone_number: store.phone_number ?? defaults.phone_number,
    district: store.district ?? defaults.district,
    address: store.address ?? defaults.address,
    latitude: stringifyOptionalValue(store.latitude),
    longitude: stringifyOptionalValue(store.longitude),
    store_description: store.store_description ?? defaults.store_description,
    store_image: null,
    existing_store_image_url: store.store_image_url ?? store.store_logo_url ?? '',
  };
}

export function toFarmPayload(values: FarmFormValues): StorePayload {
  return {
    store_name: values.store_name.trim(),
    phone_number: values.phone_number.trim(),
    district: values.district.trim(),
    address: values.address.trim(),
    ...(values.latitude.trim() ? { latitude: Number(values.latitude) } : {}),
    ...(values.longitude.trim() ? { longitude: Number(values.longitude) } : {}),
    ...(values.store_description?.trim()
      ? { store_description: values.store_description.trim() }
      : {}),
    ...(values.store_image ? { store_image: values.store_image } : {}),
  };
}

function StoreImageField({
  control,
  disabled,
}: {
  control: Control<FarmFormValues>;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const selectedImage = useWatch({
    control,
    name: 'store_image',
  });
  const existingImageUrl = useWatch({
    control,
    name: 'existing_store_image_url',
  });
  const previewUri = selectedImage?.uri ?? existingImageUrl ?? null;

  return (
    <Controller
      control={control}
      name="store_image"
      render={({ field: { onChange } }) => {
        const handlePickImage = async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

          if (permission.status !== 'granted') {
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsMultipleSelection: false,
          });

          if (result.canceled || result.assets.length === 0) {
            return;
          }

          const asset = result.assets[0];
          const pickedImage: StoreImageAsset = {
            uri: asset.uri,
            name: asset.fileName ?? getImageFileName(asset.uri, 'store-image'),
            type: asset.mimeType ?? 'image/jpeg',
          };

          onChange(pickedImage);
        };

        return (
          <View className="gap-sm">
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              Store Image (optional)
            </Text>

            {previewUri ? (
              <View
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: theme.colors.outline }}
              >
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: '100%', height: 180 }}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View
                className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
                style={{ borderColor: theme.colors.outline }}
              >
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Add a store image to help shoppers recognize your selling location.
                </Text>
              </View>
            )}

            <View className="flex-row gap-sm">
              <Button mode="contained-tonal" disabled={disabled} onPress={() => void handlePickImage()}>
                {previewUri ? 'Change Image' : 'Choose Image'}
              </Button>
              {previewUri ? (
                <Button
                  mode="text"
                  disabled={disabled}
                  onPress={() => {
                    onChange(null);
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </View>
          </View>
        );
      }}
    />
  );
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
        name="store_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label="Store Name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            errorMessage={errors.store_name?.message}
            disabled={disabled}
          />
        )}
      />

      <Controller
        control={control}
        name="phone_number"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label="Phone Number"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            errorMessage={errors.phone_number?.message}
            disabled={disabled}
          />
        )}
      />

      <StoreImageField control={control} disabled={disabled} />

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
        name="store_description"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppTextInput
            containerClassName="gap-0"
            label={descriptionLabel}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline
            numberOfLines={4}
            errorMessage={errors.store_description?.message}
            disabled={disabled}
          />
        )}
      />

      <View
        className="gap-xs rounded-lg px-md py-md"
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Latitude and longitude are optional, but provide both together if you want Google Maps
          directions and nearby marketplace matching to work accurately.
        </Text>
      </View>
    </>
  );
}

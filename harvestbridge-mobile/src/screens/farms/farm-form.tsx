import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { Button, Text } from 'react-native-paper';
import { z } from 'zod';

import { type StoreBusinessStatus, type StoreDto, type StoreImageAsset, type StorePayload } from '@/api/store.api';
import { AppTextInput } from '@/components/form/app-text-input';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getStoreStatusLabel, STORE_STATUS_OPTIONS } from '@/utils/store-status';
import {
  buildAddressFromReverseGeocode,
  buildGoogleMapsSearchUrl,
  extractDistrictFromReverseGeocode,
  formatStoreCoordinates,
} from '@/utils/store-location';

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
  .passthrough()
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
    business_status: z.enum(['open', 'temporarily_closed', 'closed']).default('open'),
    store_logo: storeImageSchema,
    existing_store_logo_url: z.string().optional().or(z.literal('')),
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

    if (hasLatitude) {
      const latitude = Number(values.latitude);

      if (latitude < -90 || latitude > 90) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['latitude'],
          message: 'Latitude must be between -90 and 90.',
        });
      }
    }

    if (hasLongitude) {
      const longitude = Number(values.longitude);

      if (longitude < -180 || longitude > 180) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['longitude'],
          message: 'Longitude must be between -180 and 180.',
        });
      }
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

async function resolveWebImageFile(params: {
  asset: ImagePicker.ImagePickerAsset;
  mimeType: string;
  fileName: string;
}) {
  const directFile =
    'file' in params.asset
      ? ((params.asset as ImagePicker.ImagePickerAsset & { file?: Blob | null }).file ?? null)
      : null;

  if (directFile) {
    return directFile;
  }

  if (Platform.OS !== 'web') {
    return null;
  }

  const response = await fetch(params.asset.uri);
  const blob = await response.blob();

  if (typeof File !== 'undefined') {
    return new File([blob], params.fileName, {
      type: params.mimeType,
    });
  }

  return blob;
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
    business_status: 'open',
    store_logo: null,
    existing_store_logo_url: '',
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
    business_status: (store.business_status as StoreBusinessStatus | null | undefined) ?? defaults.business_status,
    store_logo: null,
    existing_store_logo_url: store.store_logo_url ?? store.logo_url ?? store.store_image_url ?? '',
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
    business_status: values.business_status,
    ...(values.store_logo ? { store_logo: values.store_logo } : {}),
  };
}

function StoreLogoField({
  control,
  disabled,
}: {
  control: Control<FarmFormValues>;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const selectedImage = useWatch({
    control,
    name: 'store_logo',
  });
  const existingImageUrl = useWatch({
    control,
    name: 'existing_store_logo_url',
  });
  const previewUri = selectedImage?.uri ?? existingImageUrl ?? null;

  return (
    <Controller
      control={control}
      name="store_logo"
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
          const fileName = asset.fileName ?? getImageFileName(asset.uri, 'store-logo');
          const mimeType = asset.mimeType ?? 'image/jpeg';
          const browserFile = await resolveWebImageFile({
            asset,
            mimeType,
            fileName,
          });
          const pickedImage: StoreImageAsset = {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            file: browserFile,
          };

          onChange(pickedImage);
        };

        return (
          <View className="gap-sm">
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              Store Logo (optional)
            </Text>

            {previewUri ? (
              <View
                className="overflow-hidden rounded-lg border"
                style={{ borderColor: theme.colors.outline }}
              >
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: '100%', height: 160 }}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View
                className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
                style={{ borderColor: theme.colors.outline }}
              >
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Upload a store logo to represent your store in listings and profile views.
                </Text>
              </View>
            )}

            <View className="flex-row gap-sm">
              <Button mode="contained-tonal" disabled={disabled} onPress={() => void handlePickImage()}>
                {previewUri ? 'Change Logo' : 'Upload Logo'}
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

function StoreLocationFieldGroup({
  control,
  disabled,
  setValue,
}: {
  control: Control<FarmFormValues>;
  disabled: boolean;
  setValue: UseFormSetValue<FarmFormValues>;
}) {
  const theme = useAppTheme();
  const [latitude, longitude, address, district] = useWatch({
    control,
    name: ['latitude', 'longitude', 'address', 'district'],
  });
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const googleMapsUrl = buildGoogleMapsSearchUrl(latitude, longitude);

  const handleUseCurrentLocation = async () => {
    setIsResolvingLocation(true);
    setLocationMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationMessage('Location permission is required to use your current store position.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLatitude = position.coords.latitude.toFixed(6);
      const nextLongitude = position.coords.longitude.toFixed(6);

      setValue('latitude', nextLatitude, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('longitude', nextLongitude, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const reverseResults = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const bestMatch = reverseResults[0];
      const resolvedAddress = buildAddressFromReverseGeocode(bestMatch);
      const resolvedDistrict = extractDistrictFromReverseGeocode(bestMatch);

      if (resolvedAddress) {
        setValue('address', resolvedAddress, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (resolvedDistrict) {
        setValue('district', resolvedDistrict, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      setLocationMessage(
        resolvedAddress || resolvedDistrict
          ? 'Store location updated from your current device position.'
          : 'Coordinates updated from your current device position.',
      );
    } catch {
      setLocationMessage('Unable to resolve your current location right now.');
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleOpenGoogleMaps = async () => {
    if (!googleMapsUrl) {
      setLocationMessage('Add coordinates or use your current location before opening Google Maps.');
      return;
    }

    try {
      await Linking.openURL(googleMapsUrl);
    } catch {
      setLocationMessage('Unable to open Google Maps on this device.');
    }
  };

  return (
    <View className="gap-sm">
      <View
        className="gap-sm rounded-lg border px-md py-md"
        style={{ borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
          Store Location
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Use your current location to fill coordinates automatically. If coordinates are available,
          you can preview the store pin in Google Maps.
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          <Button
            mode="contained-tonal"
            disabled={disabled || isResolvingLocation}
            loading={isResolvingLocation}
            onPress={() => {
              void handleUseCurrentLocation();
            }}
          >
            Use Current Location
          </Button>
          <Button
            mode="outlined"
            disabled={disabled}
            onPress={() => {
              void handleOpenGoogleMaps();
            }}
          >
            Preview in Google Maps
          </Button>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Current Coordinates: {formatStoreCoordinates(latitude, longitude)}
        </Text>
        {district?.trim() ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            District Preview: {district}
          </Text>
        ) : null}
        {address?.trim() ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Address Preview: {address}
          </Text>
        ) : null}
        {locationMessage ? (
          <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
            {locationMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function StoreStatusField({
  control,
  disabled,
}: {
  control: Control<FarmFormValues>;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const selectedStatus = useWatch({
    control,
    name: 'business_status',
  });

  return (
    <Controller
      control={control}
      name="business_status"
      render={({ field: { value, onChange } }) => (
        <View className="gap-sm">
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
            Store Status
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Choose how your store should appear to customers right now.
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {STORE_STATUS_OPTIONS.map((statusOption) => {
              const isActive = (value ?? selectedStatus) === statusOption;

              return (
                <Button
                  key={statusOption}
                  mode={isActive ? 'contained' : 'outlined'}
                  disabled={disabled}
                  onPress={() => {
                    onChange(statusOption);
                  }}
                >
                  {getStoreStatusLabel(statusOption)}
                </Button>
              );
            })}
          </View>
        </View>
      )}
    />
  );
}

export function FarmFormFields({
  control,
  errors,
  setValue,
  disabled = false,
  showBusinessStatus = false,
  latitudeLabel = 'Latitude',
  longitudeLabel = 'Longitude',
  descriptionLabel = 'Description',
}: {
  control: Control<FarmFormValues>;
  errors: FieldErrors<FarmFormValues>;
  setValue: UseFormSetValue<FarmFormValues>;
  disabled?: boolean;
  showBusinessStatus?: boolean;
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

      <StoreLogoField control={control} disabled={disabled} />

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

      <StoreLocationFieldGroup control={control} disabled={disabled} setValue={setValue} />

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

      {showBusinessStatus ? <StoreStatusField control={control} disabled={disabled} /> : null}

      <View
        className="gap-xs rounded-lg px-md py-md"
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Latitude and longitude are optional, but provide both together if you want Google Maps
          directions, store previews, and nearby marketplace matching to work accurately.
        </Text>
      </View>
    </>
  );
}

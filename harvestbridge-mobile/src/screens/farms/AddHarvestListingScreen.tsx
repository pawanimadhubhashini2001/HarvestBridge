import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, ScrollView, View } from 'react-native';
import { Button, Chip, HelperText, Snackbar, Text } from 'react-native-paper';
import { z } from 'zod';

import {
  createCompostListing,
  getCompostListingsQueryKey,
} from '@/api/compost-listing.api';
import { createDonation, getDonationsQueryKey } from '@/api/donation.api';
import {
  createHarvestListing,
  getHarvestListingsQueryKey,
  type HarvestListingImageAsset,
  uploadHarvestListingImages,
} from '@/api/harvest-listing.api';
import { getMyStore, getMyStoreQueryKey, getStoreDetailsQueryKey } from '@/api/store.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import type { AppError } from '@/types/api';
import { getErrorMessage } from '@/utils/errorHandler';

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '');

const MAX_PRODUCT_IMAGES = 5;
const listingTypes = ['product', 'donation', 'compost'] as const;
const productCategories = [
  'Vegetables',
  'Fruits',
  'Grains & Cereals',
  'Pulses & Legumes',
  'Herbs & Spices',
  'Nuts & Seeds',
  'Coconut Products',
] as const;
const qualityGradeOptions = ['Premium', 'Second Grade'] as const;

type ListingType = (typeof listingTypes)[number];

const addListingSchema = z
  .object({
    listing_type: z.enum(listingTypes),
    category: z.enum(productCategories).optional(),
    crop_name: z.string().trim().min(1, 'Name is required.'),
    quantity: z
      .string()
      .trim()
      .min(1, 'Quantity is required.')
      .refine(
        (value) => !Number.isNaN(Number(value)) && Number(value) > 0,
        'Enter a valid quantity.',
      ),
    unit: z.string().trim().min(1, 'Unit is required.').max(20, 'Unit is too long.'),
    price_per_unit: optionalTextSchema,
    quality_grade: optionalTextSchema,
    harvest_date: optionalTextSchema,
    available_until: optionalTextSchema,
    pickup_location: optionalTextSchema,
    description: optionalTextSchema,
  })
  .superRefine((values, context) => {
    const isProduct = values.listing_type === 'product';
    const isDonation = values.listing_type === 'donation';
    const isCompost = values.listing_type === 'compost';

    if (
      values.price_per_unit.trim()
      && (Number.isNaN(Number(values.price_per_unit)) || Number(values.price_per_unit) < 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price_per_unit'],
        message: 'Enter a valid price.',
      });
    }

    if (!values.category) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: 'Category is required.',
      });
    }

    if (isProduct) {
      if (!values.price_per_unit.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price_per_unit'],
          message: 'Price per unit is required.',
        });
      }

      if (
        values.quality_grade.length > 0
        && !qualityGradeOptions.includes(values.quality_grade as (typeof qualityGradeOptions)[number])
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quality_grade'],
          message: 'Quality grade must be Premium or Second Grade.',
        });
      }

      if (!values.harvest_date.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['harvest_date'],
          message: 'Harvest date is required.',
        });
      } else if (Number.isNaN(new Date(values.harvest_date).getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['harvest_date'],
          message: 'Use a valid date in YYYY-MM-DD format.',
        });
      }

      if (
        values.available_until.trim()
        && Number.isNaN(new Date(values.available_until).getTime())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Use a valid date in YYYY-MM-DD format.',
        });
      }

      if (
        values.harvest_date.trim()
        && values.available_until.trim()
        && new Date(values.available_until) < new Date(values.harvest_date)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Available until must be on or after the harvest date.',
        });
      }
    }

    if (isDonation) {
      if (!values.available_until.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Available until is required for donations.',
        });
      } else if (Number.isNaN(new Date(values.available_until).getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Use a valid date in YYYY-MM-DD format.',
        });
      }

      if (!values.pickup_location.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pickup_location'],
          message: 'Pickup location is required.',
        });
      }

      if (!values.description.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['description'],
          message: 'Description is required for donations.',
        });
      }
    }

    if (isCompost) {
      if (!values.harvest_date.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['harvest_date'],
          message: 'Available from is required for compost.',
        });
      } else if (Number.isNaN(new Date(values.harvest_date).getTime())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['harvest_date'],
          message: 'Use a valid date in YYYY-MM-DD format.',
        });
      }

      if (
        values.available_until.trim()
        && Number.isNaN(new Date(values.available_until).getTime())
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Use a valid date in YYYY-MM-DD format.',
        });
      }

      if (
        values.harvest_date.trim()
        && values.available_until.trim()
        && new Date(values.available_until) < new Date(values.harvest_date)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['available_until'],
          message: 'Available until must be on or after the available from date.',
        });
      }

      if (!values.pickup_location.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pickup_location'],
          message: 'Pickup location is required.',
        });
      }

      if (!values.description.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['description'],
          message: 'Description is required for compost.',
        });
      }
    }
  });

type AddListingFormValues = z.input<typeof addListingSchema>;
type AddListingSubmitValues = z.output<typeof addListingSchema>;

const unitSuggestions = ['kg', 'g', 'bundle', 'piece', 'crate', 'bag'];

function getImageFileName(uri: string) {
  const uriSegments = uri.split('/');
  const lastSegment = uriSegments[uriSegments.length - 1];

  return lastSegment || `listing-image-${Date.now()}.jpg`;
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

function getListingLabel(listingType: ListingType) {
  return listingType === 'donation'
    ? 'Donation'
    : listingType === 'compost'
      ? 'Compost'
      : 'Product';
}

export function AddHarvestListingScreen({
  navigation,
  route,
}: AppStackScreenProps<'AddHarvestListing'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<HarvestListingImageAsset[]>([]);
  const initialListingType = route.params?.listingType ?? 'product';

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    getValues,
    formState: { errors, isValid },
  } = useForm<AddListingFormValues, unknown, AddListingSubmitValues>({
    resolver: zodResolver(addListingSchema),
    mode: 'onChange',
    defaultValues: {
      listing_type: initialListingType,
      category: 'Vegetables',
      crop_name: '',
      quantity: '',
      unit: 'kg',
      price_per_unit: '',
      quality_grade: '',
      harvest_date: '',
      available_until: '',
      pickup_location: '',
      description: '',
    },
  });

  const listingType = watch('listing_type');
  const listingLabel = getListingLabel(listingType);
  const showCategory = true;
  const showPrice = true;
  const showQualityGrade = listingType === 'product';
  const showHarvestDate = listingType !== 'donation';
  const showPickupLocation = listingType !== 'product';
  const showImages = listingType !== 'donation';
  const dateFieldLabel =
    listingType === 'compost' ? 'Available From' : 'Harvest Date';

  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });

  useEffect(() => {
    if (storeQuery.data?.address && !getValues('pickup_location')) {
      setValue('pickup_location', storeQuery.data.address, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [getValues, setValue, storeQuery.data?.address]);

  const createListingMutation = useMutation({
    mutationFn: async (values: AddListingSubmitValues) => {
      if (!storeQuery.data?.id) {
        throw new Error('Create your store profile before adding listings.');
      }

      if (values.listing_type === 'donation') {
        return {
          listingType: values.listing_type,
          result: await createDonation({
            crop_name: values.crop_name.trim(),
            crop_category: values.category,
            quantity: Number(values.quantity),
            unit: values.unit.trim(),
            ...(values.price_per_unit.trim()
              ? { price_per_unit: Number(values.price_per_unit) }
              : {}),
            description: values.description.trim(),
            pickup_location: values.pickup_location.trim(),
            available_until: values.available_until.trim(),
          }),
        };
      }

      if (values.listing_type === 'compost') {
        return {
          listingType: values.listing_type,
          result: await createCompostListing({
            waste_type: values.crop_name.trim(),
            crop_category: values.category ?? 'Other',
            quantity: Number(values.quantity),
            unit: values.unit.trim(),
            ...(values.price_per_unit.trim()
              ? { price_per_unit: Number(values.price_per_unit) }
              : {}),
            pickup_location: values.pickup_location.trim(),
            available_from: values.harvest_date.trim(),
            ...(values.available_until.trim()
              ? { available_until: values.available_until.trim() }
              : {}),
            description: values.description.trim(),
            images: selectedImages,
          }),
        };
      }

      const createdListing = await createHarvestListing({
        farm_id: storeQuery.data.id,
        crop_name: values.crop_name.trim(),
        crop_category: values.category,
        quantity: Number(values.quantity),
        unit: values.unit.trim(),
        price_per_unit: Number(values.price_per_unit),
        ...(values.quality_grade.trim()
          ? { quality_grade: values.quality_grade.trim() }
          : {}),
        harvest_date: values.harvest_date.trim(),
        ...(values.available_until.trim()
          ? { available_until: values.available_until.trim() }
          : {}),
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
      });

      const finalListing =
        selectedImages.length > 0
          ? await uploadHarvestListingImages(createdListing.id, selectedImages)
          : createdListing;

      return {
        listingType: values.listing_type,
        result: finalListing,
      };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getHarvestListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getDonationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getCompostListingsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
        storeQuery.data?.id
          ? queryClient.invalidateQueries({
              queryKey: getStoreDetailsQueryKey(storeQuery.data.id),
            })
          : Promise.resolve(),
      ]);

      setFeedbackMessage(`${listingLabel} created successfully. Returning to your store profile...`);

      setTimeout(() => {
        navigation.replace('FarmDetails', {
          farmId: String(storeQuery.data?.id ?? ''),
        });
      }, 400);
    },
    onError: (error: AppError) => {
      setFeedbackMessage(error.message);

      const fieldNames: Array<keyof AddListingFormValues> = [
        'listing_type',
        'category',
        'crop_name',
        'quantity',
        'unit',
        'price_per_unit',
        'quality_grade',
        'harvest_date',
        'available_until',
        'pickup_location',
        'description',
      ];

      fieldNames.forEach((fieldName) => {
        const fieldError = error.errors?.[fieldName];

        if (fieldError) {
          setError(fieldName, {
            message: Array.isArray(fieldError) ? fieldError[0] : fieldError,
          });
        }
      });
    },
  });

  async function handlePickImages() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Photo library permission is required to upload listing images.');
      }

      const remainingSlots = MAX_PRODUCT_IMAGES - selectedImages.length;

      if (remainingSlots <= 0) {
        setFeedbackMessage(`You can upload up to ${MAX_PRODUCT_IMAGES} images.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const nextImages = await Promise.all(
        result.assets.map(async (asset) => {
          const fileName = asset.fileName ?? getImageFileName(asset.uri);
          const mimeType = asset.mimeType ?? 'image/jpeg';
          const browserFile = await resolveWebImageFile({
            asset,
            mimeType,
            fileName,
          });

          return {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
            file: browserFile,
          } satisfies HarvestListingImageAsset;
        }),
      );

      setSelectedImages((currentImages) =>
        [...currentImages, ...nextImages].slice(0, MAX_PRODUCT_IMAGES),
      );
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  }

  function handleRemoveImage(index: number) {
    setSelectedImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  const typeDescription = useMemo(() => {
    if (listingType === 'donation') {
      return 'Create a donation listing for NGOs. Price is not required.';
    }

    if (listingType === 'compost') {
      return 'Create a compost listing for agricultural waste collection. Price is not required.';
    }

    return 'Create a marketplace product listing for your store.';
  }, [listingType]);

  const nameFieldLabel = 'Crop Name';
  const availableUntilLabel =
    listingType === 'donation' ? 'Available Until' : 'Available Until (optional)';
  const priceLabel =
    listingType === 'product'
      ? 'Price Per Unit (LKR)'
      : 'Price Per Unit (optional)';

  const onSubmit = handleSubmit(async (values) => {
    await createListingMutation.mutateAsync(values);
  });

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Checking your store profile..." />;
  }

  if (storeQuery.isError && storeQuery.data === undefined) {
    return (
      <ErrorState
        title="Unable to load your store"
        message={getErrorMessage(storeQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void storeQuery.refetch();
        }}
      />
    );
  }

  if (!storeQuery.data) {
    return (
      <ErrorState
        title="No store profile yet"
        message="Create your store profile before adding listings."
        actionLabel="Create Store"
        onAction={() => {
          navigation.replace('AddFarm');
        }}
      />
    );
  }

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
          Listing Manager
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Add {listingLabel}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {typeDescription}
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <View className="gap-sm">
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
            Listing Type
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {listingTypes.map((typeOption) => (
              <Chip
                key={typeOption}
                selected={listingType === typeOption}
                onPress={() => {
                  setValue('listing_type', typeOption, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                {getListingLabel(typeOption)}
              </Chip>
            ))}
          </View>
        </View>

        {showCategory ? (
          <View className="gap-sm">
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              Category
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {productCategories.map((categoryOption) => (
                <Chip
                  key={categoryOption}
                  selected={watch('category') === categoryOption}
                  onPress={() => {
                    setValue('category', categoryOption, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  {categoryOption}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={Boolean(errors.category?.message)}>
              {errors.category?.message ?? ''}
            </HelperText>
          </View>
        ) : null}

        <Controller
          control={control}
          name="crop_name"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label={nameFieldLabel}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={
                listingType === 'compost'
                  ? 'Enter compost or waste type'
                  : 'Enter any crop or item name'
              }
              errorMessage={errors.crop_name?.message}
              disabled={createListingMutation.isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="quantity"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label="Quantity"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              errorMessage={errors.quantity?.message}
              disabled={createListingMutation.isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label="Unit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              errorMessage={errors.unit?.message}
              disabled={createListingMutation.isPending}
            />
          )}
        />
        <View className="flex-row flex-wrap gap-sm">
          {unitSuggestions.map((unit) => (
            <Chip
              key={unit}
              selected={watch('unit') === unit}
              onPress={() => {
                setValue('unit', unit, { shouldDirty: true, shouldValidate: true });
              }}
            >
              {unit}
            </Chip>
          ))}
        </View>

        {showPrice ? (
          <Controller
            control={control}
            name="price_per_unit"
            render={({ field: { value, onChange, onBlur } }) => (
              <AppTextInput
                label={priceLabel}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                errorMessage={errors.price_per_unit?.message}
                disabled={createListingMutation.isPending}
              />
            )}
          />
        ) : null}

        {showQualityGrade ? (
          <>
            <Controller
              control={control}
              name="quality_grade"
              render={({ field: { value, onChange, onBlur } }) => (
                <AppTextInput
                  label="Quality Grade (optional)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.quality_grade?.message}
                  disabled={createListingMutation.isPending}
                />
              )}
            />
            <View className="flex-row flex-wrap gap-sm">
              {qualityGradeOptions.map((grade) => (
                <Chip
                  key={grade}
                  selected={watch('quality_grade') === grade}
                  onPress={() => {
                    setValue('quality_grade', grade, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  {grade}
                </Chip>
              ))}
            </View>
          </>
        ) : null}

        {showHarvestDate ? (
          <Controller
            control={control}
            name="harvest_date"
            render={({ field: { value, onChange, onBlur } }) => (
              <AppTextInput
                label={dateFieldLabel}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="YYYY-MM-DD"
                errorMessage={errors.harvest_date?.message}
                disabled={createListingMutation.isPending}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="available_until"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label={availableUntilLabel}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="YYYY-MM-DD"
              errorMessage={errors.available_until?.message}
              disabled={createListingMutation.isPending}
            />
          )}
        />

        {showPickupLocation ? (
          <Controller
            control={control}
            name="pickup_location"
            render={({ field: { value, onChange, onBlur } }) => (
              <AppTextInput
                label="Pickup Location"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.pickup_location?.message}
                disabled={createListingMutation.isPending}
              />
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppTextInput
              label={
                listingType === 'product'
                  ? 'Description (optional)'
                  : 'Description'
              }
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              errorMessage={errors.description?.message}
              disabled={createListingMutation.isPending}
            />
          )}
        />

        {showImages ? (
          <View className="gap-sm">
            <View className="gap-xs">
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                {listingType === 'compost' ? 'Compost Images' : 'Product Images'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Add up to {MAX_PRODUCT_IMAGES} JPG, PNG, or WEBP images.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{selectedImages.length} / {MAX_PRODUCT_IMAGES} selected</Chip>
              {selectedImages.length > 0 ? <Chip compact>Primary image ready</Chip> : null}
            </View>

            {selectedImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-sm">
                  {selectedImages.map((image, index) => (
                    <View key={`${image.uri}-${index}`} className="gap-xs">
                      <View
                        className="overflow-hidden rounded-lg border"
                        style={{ borderColor: theme.colors.outline }}
                      >
                        <Image source={{ uri: image.uri }} style={{ width: 112, height: 112 }} contentFit="cover" />
                      </View>
                      <View className="items-center gap-xs">
                        {index === 0 ? <Chip compact>Primary</Chip> : null}
                        <Button
                          mode="text"
                          compact
                          textColor="#B42318"
                          onPress={() => {
                            handleRemoveImage(index);
                          }}
                          disabled={createListingMutation.isPending}
                        >
                          Remove
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View
                className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
                style={{
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  No images selected yet.
                </Text>
              </View>
            )}

            <View className="flex-row flex-wrap gap-sm">
              <Button
                mode="contained-tonal"
                onPress={() => {
                  void handlePickImages();
                }}
                disabled={createListingMutation.isPending || selectedImages.length >= MAX_PRODUCT_IMAGES}
              >
                {selectedImages.length > 0 ? 'Add More Images' : 'Add Images'}
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedImages([]);
                }}
                disabled={createListingMutation.isPending || selectedImages.length === 0}
              >
                Clear Images
              </Button>
            </View>
          </View>
        ) : null}

        <View className="flex-row gap-sm">
          <View className="flex-1">
            <Button
              mode="outlined"
              disabled={createListingMutation.isPending}
              onPress={() => {
                navigation.goBack();
              }}
            >
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              mode="contained"
              loading={createListingMutation.isPending}
              disabled={!isValid || createListingMutation.isPending}
              onPress={() => {
                void onSubmit();
              }}
            >
              Save {listingLabel}
            </Button>
          </View>
        </View>
      </View>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}

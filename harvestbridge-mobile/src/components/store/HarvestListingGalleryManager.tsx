import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Chip, Snackbar, Text } from 'react-native-paper';

import {
  deleteHarvestListingImage,
  getHarvestListingsQueryKey,
  reorderHarvestListingImages,
  setHarvestListingPrimaryImage,
  uploadHarvestListingImages,
  type HarvestListingDto,
  type HarvestListingImageAsset,
} from '@/api/harvest-listing.api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

const MAX_IMAGES = 5;

function getImageFileName(uri: string) {
  const segments = uri.split('/');
  const name = segments[segments.length - 1];

  return name || `harvest-image-${Date.now()}.jpg`;
}

interface HarvestListingGalleryManagerProps {
  listing: HarvestListingDto;
}

export function HarvestListingGalleryManager({
  listing,
}: HarvestListingGalleryManagerProps) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(
    listing.primary_image?.id ?? listing.images[0]?.id ?? null,
  );

  const syncListing = async (updatedListing: HarvestListingDto, successMessage: string) => {
    queryClient.setQueryData<HarvestListingDto[]>(
      getHarvestListingsQueryKey(),
      (currentListings) =>
        currentListings?.map((currentListing) =>
          currentListing.id === updatedListing.id ? updatedListing : currentListing,
        ) ?? [updatedListing],
    );
    await queryClient.invalidateQueries({ queryKey: getHarvestListingsQueryKey() });
    setSelectedImageId(updatedListing.primary_image?.id ?? updatedListing.images[0]?.id ?? null);
    setFeedbackMessage(successMessage);
  };

  const uploadImagesMutation = useMutation({
    mutationFn: async (images: HarvestListingImageAsset[]) =>
      uploadHarvestListingImages(listing.id, images),
    onSuccess: async (updatedListing) => {
      await syncListing(updatedListing, 'Product gallery updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => deleteHarvestListingImage(listing.id, imageId),
    onSuccess: async (updatedListing) => {
      await syncListing(updatedListing, 'Image deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: number) => setHarvestListingPrimaryImage(listing.id, imageId),
    onSuccess: async (updatedListing) => {
      await syncListing(updatedListing, 'Primary image updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const reorderImagesMutation = useMutation({
    mutationFn: async (imageIds: number[]) => reorderHarvestListingImages(listing.id, imageIds),
    onSuccess: async (updatedListing) => {
      await syncListing(updatedListing, 'Image order updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const galleryImages = listing.images;
  const selectedImage =
    galleryImages.find((image) => image.id === selectedImageId)
    ?? listing.primary_image
    ?? galleryImages[0]
    ?? null;
  const selectedIndex = selectedImage
    ? galleryImages.findIndex((image) => image.id === selectedImage.id)
    : -1;
  const isBusy =
    uploadImagesMutation.isPending
    || deleteImageMutation.isPending
    || setPrimaryMutation.isPending
    || reorderImagesMutation.isPending;
  const canUploadMore = galleryImages.length < MAX_IMAGES;

  async function handleUploadImages() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Photo library permission is required to upload product images.');
      }

      const remainingSlots = MAX_IMAGES - galleryImages.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const images = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? getImageFileName(asset.uri),
        type: asset.mimeType ?? 'image/jpeg',
      }));

      await uploadImagesMutation.mutateAsync(images);
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  }

  async function handleMove(offset: -1 | 1) {
    if (!selectedImage || selectedIndex < 0) {
      return;
    }

    const targetIndex = selectedIndex + offset;

    if (targetIndex < 0 || targetIndex >= galleryImages.length) {
      return;
    }

    const reorderedIds = galleryImages.map((image) => image.id);
    const [movedId] = reorderedIds.splice(selectedIndex, 1);
    reorderedIds.splice(targetIndex, 0, movedId);

    await reorderImagesMutation.mutateAsync(reorderedIds);
  }

  return (
    <>
      <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Card.Content>
          <View className="gap-md">
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                Product Gallery
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Upload up to {MAX_IMAGES} JPG, PNG, or WEBP images. The first image is used as the primary product photo.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{galleryImages.length} / {MAX_IMAGES} images</Chip>
              {listing.primary_image ? <Chip compact>Primary image selected</Chip> : null}
            </View>

            {selectedImage ? (
              <View className="gap-sm">
                <View className="overflow-hidden rounded-lg border" style={{ borderColor: theme.colors.outline }}>
                  <Image
                    source={{ uri: selectedImage.url }}
                    style={{ width: '100%', height: 220 }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-row flex-wrap gap-sm">
                  {selectedImage.is_primary ? <Chip compact>Primary Image</Chip> : null}
                  <Chip compact>Position {selectedImage.sort_order ?? selectedIndex + 1}</Chip>
                </View>
              </View>
            ) : (
              <View
                className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
                style={{
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  No product images uploaded yet.
                </Text>
              </View>
            )}

            {galleryImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-sm">
                  {galleryImages.map((image) => {
                    const isSelected = image.id === selectedImage?.id;

                    return (
                      <View key={image.id} className="gap-xs">
                        <Button
                          mode={isSelected ? 'contained' : 'text'}
                          compact
                          onPress={() => {
                            setSelectedImageId(image.id);
                          }}
                          disabled={isBusy}
                        >
                          Image {image.sort_order ?? ''}
                        </Button>
                        <View
                          className="overflow-hidden rounded-lg border"
                          style={{
                            borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                            borderWidth: isSelected ? 2 : 1,
                          }}>
                          <Image
                            source={{ uri: image.url }}
                            style={{ width: 108, height: 108 }}
                            contentFit="cover"
                          />
                        </View>
                        {image.is_primary ? (
                          <Chip compact style={{ alignSelf: 'center' }}>
                            Primary
                          </Chip>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            ) : null}

            <View className="flex-row flex-wrap gap-sm">
              <Button
                mode="contained"
                onPress={() => {
                  void handleUploadImages();
                }}
                disabled={!canUploadMore || isBusy}
                loading={uploadImagesMutation.isPending}
              >
                Upload Images
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  if (selectedImage) {
                    void setPrimaryMutation.mutateAsync(selectedImage.id);
                  }
                }}
                disabled={!selectedImage || selectedImage.is_primary || isBusy}
                loading={setPrimaryMutation.isPending}
              >
                Select Primary Image
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  void handleMove(-1);
                }}
                disabled={!selectedImage || selectedIndex <= 0 || isBusy}
              >
                Move Left
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  void handleMove(1);
                }}
                disabled={!selectedImage || selectedIndex === -1 || selectedIndex >= galleryImages.length - 1 || isBusy}
              >
                Move Right
              </Button>
              <Button
                mode="outlined"
                textColor="#B42318"
                onPress={() => {
                  if (selectedImage) {
                    void deleteImageMutation.mutateAsync(selectedImage.id);
                  }
                }}
                disabled={!selectedImage || isBusy}
                loading={deleteImageMutation.isPending}
              >
                Delete Image
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => {
          setFeedbackMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setFeedbackMessage(null);
          },
        }}
      >
        {feedbackMessage ?? ''}
      </Snackbar>
    </>
  );
}

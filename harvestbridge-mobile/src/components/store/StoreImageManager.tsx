import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Snackbar, Text } from 'react-native-paper';

import {
  deleteStoreCover,
  deleteStoreLogo,
  getMyStoreQueryKey,
  getStoreDetailsQueryKey,
  type StoreDto,
  type StoreImageAsset,
  uploadStoreCover,
  uploadStoreLogo,
} from '@/api/store.api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

function getImageFileName(uri: string, fallbackPrefix: string) {
  const uriSegments = uri.split('/');
  const lastSegment = uriSegments[uriSegments.length - 1];

  if (lastSegment) {
    return lastSegment;
  }

  return `${fallbackPrefix}-${Date.now()}.jpg`;
}

function StoreImageSlot({
  label,
  imageUrl,
  placeholder,
  actionLabel,
  deleteLabel,
  onUpload,
  onDelete,
  uploading,
  deleting,
  height,
}: {
  label: string;
  imageUrl?: string | null;
  placeholder: string;
  actionLabel: string;
  deleteLabel: string;
  onUpload: () => void;
  onDelete: () => void;
  uploading: boolean;
  deleting: boolean;
  height: number;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-sm">
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {label}
      </Text>
      {imageUrl ? (
        <View className="overflow-hidden rounded-lg border" style={{ borderColor: theme.colors.outline }}>
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height }} contentFit="cover" />
        </View>
      ) : (
        <View
          className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
          style={{
            borderColor: theme.colors.outline,
            minHeight: height,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {placeholder}
          </Text>
        </View>
      )}
      <View className="flex-row flex-wrap gap-sm">
        <Button
          mode="contained-tonal"
          loading={uploading}
          disabled={uploading || deleting}
          onPress={onUpload}
        >
          {imageUrl ? actionLabel : actionLabel.replace('Change', 'Upload')}
        </Button>
        <Button
          mode="outlined"
          disabled={!imageUrl || uploading || deleting}
          loading={deleting}
          onPress={onDelete}
        >
          {deleteLabel}
        </Button>
      </View>
    </View>
  );
}

export function StoreImageManager({
  storeId,
  store,
}: {
  storeId: number | string;
  store: StoreDto;
}) {
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const syncStore = async (updatedStore: StoreDto, successMessage: string) => {
    queryClient.setQueryData(getMyStoreQueryKey(), updatedStore);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) }),
    ]);
    setFeedbackMessage(successMessage);
  };

  const logoUploadMutation = useMutation({
    mutationFn: async (image: StoreImageAsset) => uploadStoreLogo(storeId, image),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store logo updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const coverUploadMutation = useMutation({
    mutationFn: async (image: StoreImageAsset) => uploadStoreCover(storeId, image),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store cover image updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const logoDeleteMutation = useMutation({
    mutationFn: async () => deleteStoreLogo(storeId),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store logo deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const coverDeleteMutation = useMutation({
    mutationFn: async () => deleteStoreCover(storeId),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store cover image deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const pickImage = async (fallbackPrefix: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error('Photo library permission is required to upload a store image.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      name: asset.fileName ?? getImageFileName(asset.uri, fallbackPrefix),
      type: asset.mimeType ?? 'image/jpeg',
    } satisfies StoreImageAsset;
  };

  const handleLogoUpload = async () => {
    try {
      const image = await pickImage('store-logo');

      if (!image) {
        return;
      }

      await logoUploadMutation.mutateAsync(image);
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  };

  const handleCoverUpload = async () => {
    try {
      const image = await pickImage('store-cover');

      if (!image) {
        return;
      }

      await coverUploadMutation.mutateAsync(image);
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  };

  return (
    <>
      <Card mode="outlined">
        <Card.Content>
          <View className="gap-lg">
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                Store Images
              </Text>
              <Text variant="bodySmall">
                Upload a logo and cover image for your store. Supported formats are JPG, PNG, and
                WEBP.
              </Text>
            </View>

            <StoreImageSlot
              label="Store Cover Image"
              imageUrl={store.store_cover_image_url ?? store.cover_url}
              placeholder="Default cover placeholder"
              actionLabel="Change Cover"
              deleteLabel="Delete Cover"
              onUpload={() => {
                void handleCoverUpload();
              }}
              onDelete={() => {
                void coverDeleteMutation.mutateAsync();
              }}
              uploading={coverUploadMutation.isPending}
              deleting={coverDeleteMutation.isPending}
              height={180}
            />

            <StoreImageSlot
              label="Store Logo"
              imageUrl={store.store_logo_url ?? store.logo_url ?? store.store_image_url}
              placeholder="Default logo placeholder"
              actionLabel="Change Logo"
              deleteLabel="Delete Logo"
              onUpload={() => {
                void handleLogoUpload();
              }}
              onDelete={() => {
                void logoDeleteMutation.mutateAsync();
              }}
              uploading={logoUploadMutation.isPending}
              deleting={logoDeleteMutation.isPending}
              height={150}
            />
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

import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export type StoreStoryMediaType = 'image' | 'video';

export interface StoreStoryDto {
  id: number;
  store_id: number;
  store?: {
    id: number;
    store_name: string;
    store_logo_url?: string | null;
  } | null;
  media_type: StoreStoryMediaType;
  media_url: string;
  caption?: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoreStoryMediaAsset {
  uri: string;
  name: string;
  type: string;
  mediaType: StoreStoryMediaType;
}

export interface CreateStoreStoryPayload {
  caption?: string;
  media: StoreStoryMediaAsset;
}

export interface UpdateStoreStoryPayload {
  caption?: string;
  media?: StoreStoryMediaAsset | null;
}

function buildStoryFormData(payload: CreateStoreStoryPayload | UpdateStoreStoryPayload) {
  const formData = new FormData();

  if (typeof payload.caption === 'string') {
    formData.append('caption', payload.caption.trim());
  }

  if (payload.media) {
    formData.append('media', {
      uri: payload.media.uri,
      name: payload.media.name,
      type: payload.media.type,
    } as unknown as Blob);
  }

  return formData;
}

export function getMyStoreStoriesQueryKey() {
  return ['store', 'stories', 'me'] as const;
}

export async function getMyStoreStories() {
  const response = await apiClient.get<ApiSuccessResponse<StoreStoryDto[]>>('/stores/me/stories');

  return response.data.data;
}

export async function createStoreStory(
  storeId: number | string,
  payload: CreateStoreStoryPayload,
) {
  const response = await apiClient.post<ApiSuccessResponse<StoreStoryDto>>(
    `/stores/${storeId}/stories`,
    buildStoryFormData(payload),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function updateStoreStory(
  storeId: number | string,
  storyId: number | string,
  payload: UpdateStoreStoryPayload,
) {
  const formData = buildStoryFormData(payload);
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiSuccessResponse<StoreStoryDto>>(
    `/stores/${storeId}/stories/${storyId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteStoreStory(storeId: number | string, storyId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/stores/${storeId}/stories/${storyId}`,
  );

  return response.data;
}

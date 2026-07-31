import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export type StoryFeedSort = 'distance' | 'newest';

export interface StoryFeedStoryDto {
  id: number;
  store_id: number;
  store?: {
    id: number;
    store_name: string;
    district?: string | null;
    address?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    phone_number?: string | null;
    store_logo_url?: string | null;
    actions?: {
      phone?: string | null;
      whatsapp?: string | null;
      google_maps_url?: string | null;
      open_maps_action?: {
        type: 'open_url';
        label: string;
        url: string;
      } | null;
    };
  } | null;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string | null;
  distance?: number | null;
  distance_km?: number | null;
  view_count?: number | null;
  viewed_users_count?: number | null;
  viewed_users?: {
    id: number;
    name: string;
    viewed_at: string;
  }[];
  created_at: string;
  expires_at: string;
}

export interface StoryFeedQueryParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  sort?: StoryFeedSort;
  page?: number;
  per_page?: number;
}

export interface StoryFeedDto {
  stories: StoryFeedStoryDto[];
  pagination: {
    links?: {
      url: string | null;
      label: string;
      active: boolean;
    }[] | null;
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number | null;
      to: number | null;
      [key: string]: unknown;
    } | null;
  };
  sort: StoryFeedSort;
}

export function getStoryFeedQueryKey(params: Partial<StoryFeedQueryParams>) {
  return ['stories', 'feed', params] as const;
}

export async function getStoryFeed(params: StoryFeedQueryParams) {
  const response = await apiClient.get<ApiSuccessResponse<StoryFeedDto>>('/stories/feed', {
    params,
  });

  return response.data.data;
}

export async function recordStoryView(storyId: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<StoryFeedStoryDto>>(
    `/stories/${storyId}/view`,
  );

  return response.data.data;
}

import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface CompostListingImageAsset {
  uri: string;
  name: string;
  type: string;
  file?: Blob | null;
}

export interface CompostListingDto {
  id: number;
  waste_type: string;
  crop_category?: string | null;
  distance?: number | null;
  distance_km?: number | null;
  quantity: number | string;
  unit: string;
  price_per_unit?: number | string | null;
  description?: string | null;
  notes?: string | null;
  pickup_location?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  status: string;
  collection_status?: string;
  images?: {
    id: number;
    url: string;
    sort_order?: number | null;
  }[];
  primary_image?: {
    id: number;
    url: string;
    sort_order?: number | null;
  } | null;
  farmer?: {
    id?: number;
    name?: string | null;
    phone?: string | null;
  } | null;
  store?: {
    id?: number;
    store_name?: string | null;
    district?: string | null;
    address?: string | null;
    phone_number?: string | null;
    business_status?: string | null;
    store_logo_url?: string | null;
  } | null;
  actions?: {
    phone?: string | null;
    google_maps_url?: string | null;
    open_maps_action?: {
      type: string;
      label: string;
      url: string;
    } | null;
    can_mark_collected?: boolean;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CompostMarketplaceQueryParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  waste_type?: string;
  pickup_location?: string;
  date?: string;
}

export interface AvailableCompostDto {
  listings: CompostListingDto[];
  radius?: number | string | null;
}

export interface CompostRequestDto {
  id: number;
  compost_listing_id: number;
  business_id: number;
  quantity?: number | string | null;
  pickup_date: string;
  pickup_time: string;
  status: string;
  notes?: string | null;
  compost_listing?: CompostListingDto | null;
  actions?: {
    phone?: string | null;
    google_maps_url?: string | null;
    open_maps_action?: {
      type: string;
      label: string;
      url: string;
    } | null;
  } | null;
}

export interface CreateCompostRequestPayload {
  compost_listing_id: number;
  quantity: number;
  pickup_date: string;
  pickup_time: string;
  notes?: string;
}

export interface CreateCompostListingPayload {
  harvest_listing_id?: number;
  waste_type: string;
  crop_category: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  pickup_location: string;
  available_from: string;
  available_until?: string;
  description: string;
  notes?: string;
  images?: CompostListingImageAsset[];
}

type CompostListingFormPayload = Partial<Omit<
  CreateCompostListingPayload,
  'price_per_unit' | 'available_until' | 'notes'
>> & {
  price_per_unit?: number | null;
  available_until?: string | null;
  notes?: string | null;
};

export type UpdateCompostListingPayload = CompostListingFormPayload;

export function getCompostListingsQueryKey() {
  return ['compost-listings'] as const;
}

export async function getCompostListings() {
  const response = await apiClient.get<ApiSuccessResponse<CompostListingDto[]>>('/compost-listings');

  return response.data.data;
}

export function getAvailableCompostQueryKey(params: Partial<CompostMarketplaceQueryParams>) {
  return ['available-compost', params] as const;
}

export function getCompostRequestsQueryKey() {
  return ['my-compost-requests'] as const;
}

export async function getAvailableCompost(params: CompostMarketplaceQueryParams) {
  const response = await apiClient.get<ApiSuccessResponse<AvailableCompostDto>>(
    '/available-compost',
    {
      params,
    },
  );

  return response.data.data;
}

export async function createCompostRequest(payload: CreateCompostRequestPayload) {
  const response = await apiClient.post<ApiSuccessResponse<CompostRequestDto>>(
    '/compost-requests',
    payload,
  );

  return response.data.data;
}

export async function getCompostRequests() {
  const response = await apiClient.get<ApiSuccessResponse<CompostRequestDto[]>>(
    '/my-compost-requests',
  );

  return response.data.data;
}

export async function createCompostListing(payload: CreateCompostListingPayload) {
  const formData = buildCompostListingFormData(payload);

  const response = await apiClient.post<ApiSuccessResponse<CompostListingDto>>(
    '/compost-listings',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function updateCompostListing(
  listingId: number,
  payload: UpdateCompostListingPayload,
) {
  const formData = buildCompostListingFormData(payload);
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiSuccessResponse<CompostListingDto>>(
    `/compost-listings/${listingId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteCompostListing(listingId: number) {
  await apiClient.delete(`/compost-listings/${listingId}`);
}

function buildCompostListingFormData(payload: CompostListingFormPayload) {
  const formData = new FormData();

  if (payload.harvest_listing_id !== undefined) {
    formData.append('harvest_listing_id', String(payload.harvest_listing_id));
  }

  if (payload.waste_type !== undefined) {
    formData.append('waste_type', payload.waste_type);
  }

  if (payload.crop_category !== undefined) {
    formData.append('crop_category', payload.crop_category);
  }

  if (payload.quantity !== undefined) {
    formData.append('quantity', String(payload.quantity));
  }

  if (payload.unit !== undefined) {
    formData.append('unit', payload.unit);
  }

  if (payload.price_per_unit !== undefined && payload.price_per_unit !== null) {
    formData.append('price_per_unit', String(payload.price_per_unit));
  } else if (payload.price_per_unit === null) {
    formData.append('price_per_unit', '');
  }

  if (payload.pickup_location !== undefined) {
    formData.append('pickup_location', payload.pickup_location);
  }

  if (payload.available_from !== undefined) {
    formData.append('available_from', payload.available_from);
  }

  if (payload.available_until) {
    formData.append('available_until', payload.available_until);
  } else if (payload.available_until === null) {
    formData.append('available_until', '');
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }

  if (payload.notes) {
    formData.append('notes', payload.notes);
  } else if (payload.notes === null) {
    formData.append('notes', '');
  }

  (payload.images ?? []).forEach((image) => {
    const imageFile =
      image.file
      ?? ({
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as unknown as Blob);

    formData.append('images[]', imageFile, image.name);
  });

  return formData;
}

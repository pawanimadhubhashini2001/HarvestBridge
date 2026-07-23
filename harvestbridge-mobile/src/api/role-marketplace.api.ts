import {
  getAvailableCompost,
  type CompostListingDto,
  type CompostMarketplaceQueryParams,
} from '@/api/compost-listing.api';
import {
  getAvailableDonations,
  type DonationDto,
  type DonationMarketplaceQueryParams,
} from '@/api/donation.api';
import {
  getMarketplace,
  type MarketplaceImageDto,
  type MarketplaceIndexDto,
  type MarketplaceListingDto,
  type MarketplaceOpenMapsActionDto,
  type MarketplacePaginationMetaDto,
  type MarketplaceQueryParams,
  type MarketplaceStoreSummaryDto,
} from '@/api/marketplace.api';

export type RoleMarketplaceMode = 'products' | 'donations' | 'compost';

export interface RoleMarketplaceIndexDto {
  listings: MarketplaceListingDto[];
  pagination: {
    meta?: MarketplacePaginationMetaDto | null;
  };
  used_radius: number | string | null;
  results_found: number;
  expanded: boolean;
  message?: string | null;
  nearby_suggestions?: MarketplaceIndexDto['nearby_suggestions'];
  recommended_for_you?: MarketplaceIndexDto['recommended_for_you'];
  source: RoleMarketplaceMode;
}

export function getRoleMarketplaceQueryKey(
  mode: RoleMarketplaceMode,
  params: Partial<MarketplaceQueryParams>,
) {
  return ['role-marketplace', mode, params] as const;
}

export async function getRoleMarketplace(
  mode: RoleMarketplaceMode,
  params: MarketplaceQueryParams,
): Promise<RoleMarketplaceIndexDto> {
  if (mode === 'products') {
    return normalizeProductMarketplace(await getMarketplace(params));
  }

  if (mode === 'donations') {
    const donationParams: DonationMarketplaceQueryParams = {
      search: params.search,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius,
      page: params.page,
      per_page: params.per_page,
      sort: params.sort === 'distance' ? 'nearest' : 'newest',
    };
    const response = await getAvailableDonations(donationParams);

    return {
      listings: response.donations.map(mapDonationToMarketplaceListing),
      pagination: {
        meta: response.pagination?.meta ?? null,
      },
      used_radius: response.radius ?? null,
      results_found: response.pagination?.meta?.total ?? response.donations.length,
      expanded: false,
      source: mode,
    };
  }

  const compostParams: CompostMarketplaceQueryParams = {
    latitude: params.latitude,
    longitude: params.longitude,
    radius: params.radius,
    waste_type: params.search,
  };
  const response = await getAvailableCompost(compostParams);

  return {
    listings: response.listings.map(mapCompostToMarketplaceListing),
    pagination: {
      meta: null,
    },
    used_radius: response.radius ?? null,
    results_found: response.listings.length,
    expanded: false,
    source: mode,
  };
}

function normalizeProductMarketplace(response: MarketplaceIndexDto): RoleMarketplaceIndexDto {
  return {
    listings: response.listings,
    pagination: {
      meta: response.pagination.meta ?? null,
    },
    used_radius: response.used_radius,
    results_found: response.results_found,
    expanded: response.expanded,
    message: response.message,
    nearby_suggestions: response.nearby_suggestions,
    recommended_for_you: response.recommended_for_you,
    source: 'products',
  };
}

function mapDonationToMarketplaceListing(donation: DonationDto): MarketplaceListingDto {
  const title =
    donation.crop_name
    ?? donation.product?.crop_name
    ?? donation.crop_category
    ?? donation.product?.crop_category
    ?? 'Farmer Donation';
  const store = mapStore(donation.store, donation.actions?.phone ?? donation.farmer?.phone);
  const openMapsAction = donation.location?.open_maps_action ?? donation.actions?.open_maps_action ?? null;

  return {
    id: donation.id,
    crop: title,
    farm: store?.store_name ?? donation.farmer?.name ?? null,
    farmer: donation.farmer?.name ?? null,
    district: donation.store?.district ?? donation.location?.district ?? null,
    matched_field: null,
    recommendation_reason: 'Donation added by a farmer',
    distance: donation.distance ?? donation.distance_km ?? null,
    distance_km: donation.distance_km ?? donation.distance ?? null,
    quantity: donation.quantity,
    total_quantity: donation.quantity,
    available_quantity: donation.quantity,
    reserved_quantity: 0,
    sold_quantity: 0,
    unit: donation.unit,
    price_per_unit: donation.price_per_unit ?? 0,
    quality_grade: null,
    harvest_date: null,
    available_until: donation.available_until,
    status: donation.collection_status ?? donation.status,
    is_featured: false,
    featured_until: null,
    description: donation.description ?? donation.notes ?? null,
    created_at: donation.created_at,
    updated_at: donation.updated_at ?? null,
    images: mapImages(donation.images, donation.primary_image),
    store,
    coordinates: donation.location
      ? {
          latitude: donation.location.latitude,
          longitude: donation.location.longitude,
        }
      : null,
    google_maps_url: donation.location?.google_maps_url ?? donation.actions?.google_maps_url ?? null,
    open_maps_action: mapOpenMapsAction(openMapsAction),
  };
}

function mapCompostToMarketplaceListing(listing: CompostListingDto): MarketplaceListingDto {
  const store = mapStore(listing.store, listing.actions?.phone ?? listing.farmer?.phone);
  const openMapsAction = listing.actions?.open_maps_action ?? null;

  return {
    id: listing.id,
    crop: listing.waste_type || 'Compost Material',
    farm: store?.store_name ?? listing.farmer?.name ?? null,
    farmer: listing.farmer?.name ?? null,
    district: listing.store?.district ?? null,
    matched_field: null,
    distance: listing.distance ?? listing.distance_km ?? null,
    distance_km: listing.distance_km ?? listing.distance ?? null,
    quantity: listing.quantity,
    total_quantity: listing.quantity,
    available_quantity: listing.quantity,
    reserved_quantity: 0,
    sold_quantity: 0,
    unit: listing.unit,
    price_per_unit: listing.price_per_unit ?? 0,
    quality_grade: listing.crop_category ?? null,
    harvest_date: listing.available_from,
    available_until: listing.available_until,
    status: listing.collection_status ?? listing.status,
    is_featured: false,
    featured_until: null,
    description: listing.description ?? listing.notes ?? null,
    created_at: listing.created_at,
    updated_at: listing.updated_at ?? null,
    images: mapImages(listing.images, listing.primary_image),
    store,
    coordinates: null,
    google_maps_url: listing.actions?.google_maps_url ?? null,
    open_maps_action: mapOpenMapsAction(openMapsAction),
  };
}

function mapStore(
  store:
    | DonationDto['store']
    | CompostListingDto['store']
    | undefined
    | null,
  fallbackPhone?: string | null,
): MarketplaceStoreSummaryDto | null {
  if (!store?.id) {
    return null;
  }

  return {
    id: store.id,
    store_name: store.store_name ?? 'Farmer Store',
    phone_number: store.phone_number ?? fallbackPhone ?? null,
    business_status: store.business_status ?? null,
    district: store.district ?? null,
    address: store.address ?? null,
  };
}

function mapImages(
  images:
    | Array<{
        id: number;
        url: string;
        sort_order?: number | null;
      }>
    | undefined,
  primaryImage:
    | {
        id: number;
        url: string;
        sort_order?: number | null;
      }
    | null
    | undefined,
): MarketplaceImageDto[] {
  const sourceImages = images && images.length > 0 ? images : primaryImage ? [primaryImage] : [];

  return sourceImages.map((image, index) => ({
    id: image.id,
    url: image.url,
    sort_order: image.sort_order ?? index,
  }));
}

function mapOpenMapsAction(
  action:
    | {
        type: string;
        label: string;
        url: string;
      }
    | null
    | undefined,
): MarketplaceOpenMapsActionDto | null {
  return action
    ? {
        type: action.type,
        label: action.label,
        url: action.url,
      }
    : null;
}

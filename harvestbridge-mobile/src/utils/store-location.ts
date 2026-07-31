export interface ReverseGeocodeResultLike {
  name?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
  district?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

function uniqueNonEmpty(values: (string | null | undefined)[]) {
  return values
    .map((value) => value?.trim())
    .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
}

export function buildGoogleMapsSearchUrl(
  latitude?: string | number | null,
  longitude?: string | number | null,
) {
  const latitudeNumber = typeof latitude === 'number' ? latitude : Number(latitude);
  const longitudeNumber = typeof longitude === 'number' ? longitude : Number(longitude);

  if (!Number.isFinite(latitudeNumber) || !Number.isFinite(longitudeNumber)) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitudeNumber},${longitudeNumber}`;
}

export function estimateTravelDirection(
  fromLatitude?: string | number | null,
  fromLongitude?: string | number | null,
  toLatitude?: string | number | null,
  toLongitude?: string | number | null,
) {
  const fromLatitudeNumber =
    typeof fromLatitude === 'number' ? fromLatitude : Number(fromLatitude);
  const fromLongitudeNumber =
    typeof fromLongitude === 'number' ? fromLongitude : Number(fromLongitude);
  const toLatitudeNumber = typeof toLatitude === 'number' ? toLatitude : Number(toLatitude);
  const toLongitudeNumber = typeof toLongitude === 'number' ? toLongitude : Number(toLongitude);

  if (
    !Number.isFinite(fromLatitudeNumber) ||
    !Number.isFinite(fromLongitudeNumber) ||
    !Number.isFinite(toLatitudeNumber) ||
    !Number.isFinite(toLongitudeNumber)
  ) {
    return null;
  }

  const latitudeDelta = toLatitudeNumber - fromLatitudeNumber;
  const longitudeDelta = toLongitudeNumber - fromLongitudeNumber;

  if (latitudeDelta === 0 && longitudeDelta === 0) {
    return 'Current location';
  }

  const angle = (Math.atan2(longitudeDelta, latitudeDelta) * 180) / Math.PI;
  const normalizedAngle = (angle + 360) % 360;
  const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  const directionIndex = Math.round(normalizedAngle / 45) % directions.length;

  return directions[directionIndex] ?? null;
}

export function formatStoreCoordinates(
  latitude?: string | number | null,
  longitude?: string | number | null,
) {
  const latitudeNumber = typeof latitude === 'number' ? latitude : Number(latitude);
  const longitudeNumber = typeof longitude === 'number' ? longitude : Number(longitude);

  if (!Number.isFinite(latitudeNumber) || !Number.isFinite(longitudeNumber)) {
    return 'Not provided';
  }

  return `${latitudeNumber.toFixed(4)}, ${longitudeNumber.toFixed(4)}`;
}

export function buildAddressFromReverseGeocode(result?: ReverseGeocodeResultLike | null) {
  if (!result) {
    return '';
  }

  const streetLine = uniqueNonEmpty([
    result.streetNumber ?? undefined,
    result.street ?? undefined,
  ]).join(' ');

  return uniqueNonEmpty([
    result.name ?? undefined,
    streetLine || undefined,
    result.city ?? undefined,
    result.subregion ?? undefined,
    result.region ?? undefined,
    result.postalCode ?? undefined,
    result.country ?? undefined,
  ]).join(', ');
}

export function extractDistrictFromReverseGeocode(result?: ReverseGeocodeResultLike | null) {
  return (
    result?.district?.trim() ||
    result?.subregion?.trim() ||
    result?.city?.trim() ||
    result?.region?.trim() ||
    ''
  );
}

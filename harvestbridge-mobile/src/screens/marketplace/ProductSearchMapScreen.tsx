import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { createElement, useCallback, useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Card, Chip, Searchbar, Snackbar, Text } from 'react-native-paper';

import {
  getMarketplace,
  type MarketplaceListingDto,
  type MarketplaceQueryParams,
} from '@/api/marketplace.api';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { designTokens } from '@/theme';
import { getErrorMessage } from '@/utils/errorHandler';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapPin {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
}

function toCoordinate(value?: number | string | null) {
  const numberValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatDistance(item: MarketplaceListingDto) {
  const distance = item.distance_km ?? item.distance ?? null;

  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return 'Distance unavailable';
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km away`;
}

function formatPrice(item: MarketplaceListingDto) {
  const amount = Number(item.price_per_unit);
  const formattedAmount = Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
      }).format(amount)
    : `LKR ${item.price_per_unit}`;

  return `${formattedAmount} / ${item.unit}`;
}

function buildMapPins(items: MarketplaceListingDto[], currentLocation: Coordinates | null): MapPin[] {
  const points = items
    .map((item, index) => {
      const latitude = toCoordinate(item.coordinates?.latitude);
      const longitude = toCoordinate(item.coordinates?.longitude);

      if (latitude === null || longitude === null) {
        return null;
      }

      return {
        item,
        index,
        latitude,
        longitude,
      };
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point));

  if (points.length === 0) {
    return [];
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);

  if (currentLocation) {
    latitudes.push(currentLocation.latitude);
    longitudes.push(currentLocation.longitude);
  }

  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 0.01);
  const longitudeRange = Math.max(maxLongitude - minLongitude, 0.01);

  return points.map((point) => {
    const x = 10 + ((point.longitude - minLongitude) / longitudeRange) * 80;
    const y = 90 - ((point.latitude - minLatitude) / latitudeRange) * 80;

    return {
      id: point.item.id,
      label: String(point.index + 1),
      title: point.item.crop ?? 'Product',
      subtitle: point.item.store?.store_name ?? point.item.district ?? 'Store',
      x,
      y,
    };
  });
}

function getListingCoordinates(item: MarketplaceListingDto): Coordinates | null {
  const latitude = toCoordinate(item.coordinates?.latitude);
  const longitude = toCoordinate(item.coordinates?.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildLeafletMapHtml(items: MarketplaceListingDto[], currentLocation: Coordinates | null) {
  const productMarkers = items
    .map((item, index) => {
      const coordinates = getListingCoordinates(item);

      if (!coordinates) {
        return null;
      }

      return {
        ...coordinates,
        label: String(index + 1),
        title: escapeHtml(item.crop ?? 'Product'),
        subtitle: escapeHtml(item.store?.store_name ?? item.district ?? 'Store'),
        type: 'product',
      };
    })
    .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker));
  const markers = currentLocation
    ? [
        ...productMarkers,
        {
          ...currentLocation,
          label: 'You',
          title: 'Your Location',
          subtitle: '',
          type: 'user',
        },
      ]
    : productMarkers;

  if (markers.length === 0) {
    return null;
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; }
    .pin {
      align-items: center;
      border: 2px solid #fff;
      border-radius: 18px;
      color: #fff;
      display: flex;
      font: 700 13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      height: 32px;
      justify-content: center;
      width: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,.28);
    }
    .pin-product { background: #d92f3a; }
    .pin-user {
      background: #2e7d32;
      border-radius: 16px;
      font-size: 10px;
      height: 30px;
      width: 30px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${JSON.stringify(markers)};
    const map = L.map('map', { zoomControl: true, attributionControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const bounds = [];
    markers.forEach((marker) => {
      const icon = L.divIcon({
        html: '<div class="pin ' + (marker.type === 'user' ? 'pin-user' : 'pin-product') + '">' + marker.label + '</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([marker.latitude, marker.longitude], { icon })
        .bindPopup('<strong>' + marker.title + '</strong>' + (marker.subtitle ? '<br />' + marker.subtitle : ''))
        .addTo(map);
      bounds.push([marker.latitude, marker.longitude]);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  </script>
</body>
</html>`;
}

function OpenStreetMapEmbed({ html }: { html: string | null }) {
  if (Platform.OS !== 'web' || !html) {
    return null;
  }

  return createElement('iframe', {
    srcDoc: html,
    title: 'Nearby product map',
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
    style: {
      border: 0,
      height: '100%',
      inset: 0,
      position: 'absolute',
      width: '100%',
    },
  });
}

export function ProductSearchMapScreen({ navigation }: AppTabScreenProps<'ProductSearch'>) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 390 ? 12 : 16;
  const [searchDraft, setSearchDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resolveCurrentLocation = useCallback(async () => {
    setIsResolvingLocation(true);
    setMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setMessage('Location permission is needed to show nearby products on the map.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setMessage('Unable to read your current location.');
    } finally {
      setIsResolvingLocation(false);
    }
  }, []);

  const queryParams = useMemo<MarketplaceQueryParams>(() => ({
    search: submittedSearch.trim() || undefined,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    radius: coordinates ? 100 : undefined,
    per_page: 20,
    sort: coordinates ? 'distance' : 'newest',
  }), [coordinates, submittedSearch]);

  const searchQuery = useQuery({
    queryKey: ['marketplace', 'product-map-search', queryParams] as const,
    queryFn: () => getMarketplace(queryParams),
    enabled: submittedSearch.trim().length > 0,
  });

  const listings = useMemo(() => searchQuery.data?.listings ?? [], [searchQuery.data?.listings]);
  const pins = useMemo(() => buildMapPins(listings, coordinates), [coordinates, listings]);
  const mapHtml = useMemo(
    () => buildLeafletMapHtml(listings, coordinates),
    [coordinates, listings],
  );
  const searched = submittedSearch.trim().length > 0;

  function submitSearch() {
    const nextSearch = searchDraft.trim();

    if (!nextSearch) {
      setMessage('Enter a product name to search.');
      return;
    }

    setSubmittedSearch(nextSearch);

    if (!coordinates) {
      void resolveCurrentLocation();
    }
  }

  async function openUrl(url?: string | null) {
    if (!url) {
      setMessage('Map location is not available for this product.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setMessage('Unable to open Google Maps on this device.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          gap: designTokens.spacing.md,
          paddingBottom: 28,
          paddingHorizontal: horizontalPadding,
          paddingTop: 12,
        }}>
        <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <View className="gap-md">
              <View className="gap-xs">
                <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
                  Product Search
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Search a product name and see nearby farmer stores on the map.
                </Text>
              </View>

              <Searchbar
                placeholder="Search product name..."
                value={searchDraft}
                onChangeText={setSearchDraft}
                onIconPress={submitSearch}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
                accessibilityLabel="Search nearby products"
              />

              <View className="flex-row flex-wrap gap-sm">
                <Button
                  mode="contained-tonal"
                  icon="crosshairs-gps"
                  loading={isResolvingLocation}
                  disabled={isResolvingLocation}
                  onPress={() => {
                    void resolveCurrentLocation();
                  }}>
                  Use Location
                </Button>
                {coordinates ? <Chip compact>Nearby sorting on</Chip> : <Chip compact>Location needed</Chip>}
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Card.Content>
            <View className="gap-md">
              <View className="flex-row items-center justify-between gap-sm">
                <View className="flex-1">
                  <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                    Nearby Map
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {searched
                      ? `${listings.length} result${listings.length === 1 ? '' : 's'} for ${submittedSearch}`
                      : 'Search first to place products on the map'}
                  </Text>
                </View>
                {searchQuery.isFetching ? <ActivityIndicator size="small" /> : null}
              </View>

              <View
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                  borderColor: theme.colors.outlineVariant,
                  borderRadius: designTokens.radius.lg,
                  borderWidth: 1,
                  height: 270,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                <OpenStreetMapEmbed html={mapHtml} />

                {!mapHtml ? (
                  <>
                    {[0, 1, 2, 3].map((line) => (
                      <View
                        key={`horizontal-${line}`}
                        style={{
                          backgroundColor: theme.colors.outlineVariant,
                          height: 1,
                          left: 0,
                          opacity: 0.45,
                          position: 'absolute',
                          right: 0,
                          top: `${20 + line * 20}%`,
                        }}
                      />
                    ))}
                    {[0, 1, 2, 3].map((line) => (
                      <View
                        key={`vertical-${line}`}
                        style={{
                          backgroundColor: theme.colors.outlineVariant,
                          bottom: 0,
                          opacity: 0.45,
                          left: `${20 + line * 20}%`,
                          position: 'absolute',
                          top: 0,
                          width: 1,
                        }}
                      />
                    ))}
                  </>
                ) : null}

                {coordinates && !mapHtml ? (
                  <View
                    style={{
                      alignItems: 'center',
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.surface,
                      borderRadius: 15,
                      borderWidth: 2,
                      height: 30,
                      justifyContent: 'center',
                      left: '50%',
                      marginLeft: -15,
                      marginTop: -15,
                      position: 'absolute',
                      top: '50%',
                      width: 30,
                    }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>
                      You
                    </Text>
                  </View>
                ) : null}

                {!mapHtml
                  ? pins.map((pin) => (
                    <View
                      key={pin.id}
                      style={{
                        alignItems: 'center',
                        backgroundColor: theme.colors.error,
                        borderColor: theme.colors.surface,
                        borderRadius: 16,
                        borderWidth: 2,
                        height: 32,
                        justifyContent: 'center',
                        left: `${pin.x}%`,
                        marginLeft: -16,
                        marginTop: -16,
                        position: 'absolute',
                        top: `${pin.y}%`,
                        width: 32,
                      }}>
                      <Text variant="labelMedium" style={{ color: theme.colors.onError, fontWeight: '700' }}>
                        {pin.label}
                      </Text>
                    </View>
                  ))
                  : null}

                {pins.length === 0 ? (
                  <View className="flex-1 items-center justify-center px-lg">
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>
                      {searched
                        ? 'No searched products with store coordinates are available yet.'
                        : 'Search for rice, banana, tomato, or another product.'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {pins.length > 0 ? (
                <View className="flex-row flex-wrap gap-xs">
                  {pins.map((pin) => (
                    <Chip key={pin.id} compact>
                      {pin.label}. {pin.title}
                    </Chip>
                  ))}
                </View>
              ) : null}
            </View>
          </Card.Content>
        </Card>

        {searchQuery.isError ? (
          <Card mode="outlined" style={{ borderColor: theme.colors.error }}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {getErrorMessage(searchQuery.error)}
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        {searched && !searchQuery.isLoading && listings.length === 0 && !searchQuery.isError ? (
          <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No nearby products matched this search.
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <View className="gap-md">
          {listings.map((item, index) => (
            <Card
              key={item.id}
              mode="outlined"
              onPress={() => {
                navigation.navigate('MarketplaceProductDetails', {
                  listingId: String(item.id),
                  latitude: coordinates?.latitude,
                  longitude: coordinates?.longitude,
                  distanceKm: item.distance_km ?? item.distance ?? null,
                });
              }}
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
              <Card.Content>
                <View className="gap-sm">
                  <View className="flex-row items-start justify-between gap-sm">
                    <View className="flex-1 gap-xs">
                      <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                        {index + 1}. {item.crop ?? 'Product'}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.store?.store_name ?? item.farm ?? 'Store unavailable'}
                      </Text>
                    </View>
                    <Chip compact>{formatDistance(item)}</Chip>
                  </View>

                  <View className="flex-row flex-wrap gap-xs">
                    {item.district ? <Chip compact>{item.district}</Chip> : null}
                    <Chip compact>{item.available_quantity} {item.unit} left</Chip>
                    <Chip compact>{formatPrice(item)}</Chip>
                  </View>

                  <View className="flex-row flex-wrap gap-sm">
                    <Button
                      mode="contained"
                      icon="map-marker-path"
                      onPress={() => {
                        void openUrl(item.open_maps_action?.url ?? item.google_maps_url);
                      }}>
                      Directions
                    </Button>
                    <Button
                      mode="outlined"
                      icon="information-outline"
                      onPress={() => {
                        navigation.navigate('MarketplaceProductDetails', {
                          listingId: String(item.id),
                          latitude: coordinates?.latitude,
                          longitude: coordinates?.longitude,
                          distanceKm: item.distance_km ?? item.distance ?? null,
                        });
                      }}>
                      Details
                    </Button>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage(null)}>
        {message}
      </Snackbar>
    </SafeAreaView>
  );
}

import { Image } from 'expo-image';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import type { HarvestListingDto } from '@/api/harvest-listing.api';
import { useAppTheme } from '@/hooks/use-app-theme';

interface FarmerProductCardProps {
  item: HarvestListingDto;
  onEdit: () => void;
  onChangeStatus: () => void;
  onHideToggle: () => void;
  onManageGallery: () => void;
  onDelete: () => void;
  busy?: boolean;
}

function formatCurrency(value: number | string, unit?: string) {
  const amount = Number(value);
  const formattedAmount = Number.isFinite(amount)
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 2,
      }).format(amount)
    : `LKR ${value}`;

  return unit ? `${formattedAmount} / ${unit}` : formattedAmount;
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function FarmerProductCard({
  item,
  onEdit,
  onChangeStatus,
  onHideToggle,
  onManageGallery,
  onDelete,
  busy = false,
}: FarmerProductCardProps) {
  const theme = useAppTheme();
  const primaryImageUrl = item.images[0]?.url ?? null;

  return (
    <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="flex-row gap-md">
            <View
              className="items-center justify-center overflow-hidden rounded-lg"
              style={{
                width: 88,
                height: 88,
                backgroundColor: theme.colors.surfaceVariant,
              }}>
              {primaryImageUrl ? (
                <Image
                  source={{ uri: primaryImageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No Image
                </Text>
              )}
            </View>

            <View className="flex-1 gap-sm">
              <View className="gap-xs">
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                  {item.crop ?? 'Harvest Product'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.crop_category ?? 'Uncategorized'}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-sm">
                <Chip compact>{item.status_label ?? item.status}</Chip>
                <Chip compact>
                  {item.available_quantity} {item.unit} available
                </Chip>
                <Chip compact>{item.is_available ? 'Visible to customers' : 'Not visible'}</Chip>
              </View>

              <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {formatCurrency(item.price_per_unit, item.unit)}
              </Text>
            </View>
          </View>

          <View className="gap-xs">
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Harvest Date: {formatDate(item.harvest_date)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Available Until: {formatDate(item.available_until)}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-sm">
            <Button mode="outlined" onPress={onEdit} disabled={busy}>
              Edit
            </Button>
            <Button mode="outlined" onPress={onChangeStatus} disabled={busy}>
              Change Status
            </Button>
            <Button mode="outlined" onPress={onHideToggle} disabled={busy}>
              {item.status === 'hidden' ? 'Reactivate' : 'Hide'}
            </Button>
            <Button mode="outlined" onPress={onManageGallery} disabled={busy}>
              Manage Gallery
            </Button>
            <Button mode="outlined" textColor="#B42318" onPress={onDelete} disabled={busy}>
              Delete
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

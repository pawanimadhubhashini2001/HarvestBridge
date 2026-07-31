import type { StoreBusinessStatus } from '@/api/store.api';

export const STORE_STATUS_OPTIONS: StoreBusinessStatus[] = [
  'open',
  'temporarily_closed',
  'closed',
];

export function getStoreStatusLabel(status?: StoreBusinessStatus | string | null) {
  switch (status) {
    case 'open':
      return 'Open';
    case 'temporarily_closed':
      return 'Temporarily Closed';
    case 'closed':
      return 'Closed';
    default:
      return 'Open';
  }
}

export function getStoreStatusIndicator(status?: StoreBusinessStatus | string | null) {
  switch (status) {
    case 'open':
      return '🟢';
    case 'temporarily_closed':
      return '🟡';
    case 'closed':
      return '🔴';
    default:
      return '🟢';
  }
}

export function formatStoreStatus(status?: StoreBusinessStatus | string | null) {
  return `${getStoreStatusIndicator(status)} ${getStoreStatusLabel(status)}`;
}

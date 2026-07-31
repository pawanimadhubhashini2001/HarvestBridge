import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatDate, formatNumber, titleCase } from '../lib/format';
import { deleteCompostListing, getCompostListings, hideCompostListing } from '../services/admin';
import type { CompostRecord } from '../types/api';

export function CompostPage() {
  return (
    <ResourceTablePage<CompostRecord>
      title="Compost Listings"
      description="Moderate compostable waste marketplace listings."
      fetcher={getCompostListings}
      emptyTitle="No compost listings found"
      emptyDescription="Compost listings matching the active filters will appear here."
      filters={[
        {
          key: 'status',
          label: 'All statuses',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Reserved', value: 'reserved' },
            { label: 'Collected', value: 'collected' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ]}
      columns={[
        { key: 'type', header: 'Waste Type', render: (listing) => listing.waste_type ?? listing.crop_category ?? `Listing #${listing.id}` },
        { key: 'farmer', header: 'Farmer', render: (listing) => listing.farmer?.name ?? 'Unknown' },
        { key: 'store', header: 'Store', render: (listing) => listing.store?.store_name ?? 'Unknown' },
        { key: 'quantity', header: 'Quantity', render: (listing) => `${formatNumber(listing.quantity)} ${listing.unit ?? ''}` },
        { key: 'status', header: 'Status', render: (listing) => <Badge tone={statusTone(listing.status)}>{titleCase(listing.status)}</Badge> },
        { key: 'created_at', header: 'Created', render: (listing) => formatDate(listing.created_at) },
      ]}
      actions={[
        {
          label: 'Hide',
          hidden: (listing) => listing.status === 'cancelled',
          confirmTitle: () => 'Hide this compost listing?',
          confirmDescription: () => 'The listing will be marked cancelled and removed from normal compost browsing.',
          onConfirm: (listing) => hideCompostListing(listing.id).then(() => undefined),
        },
        {
          label: 'Delete',
          variant: 'danger',
          confirmTitle: () => 'Delete this compost listing?',
          confirmDescription: () => 'This removes the compost listing. Use this for spam, duplicates, or inappropriate content.',
          onConfirm: (listing) => deleteCompostListing(listing.id).then(() => undefined),
        },
      ]}
    />
  );
}

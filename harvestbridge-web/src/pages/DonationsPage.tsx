import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatDate, formatNumber, titleCase } from '../lib/format';
import { deleteDonation, getDonations, hideDonation } from '../services/admin';
import type { DonationRecord } from '../types/api';

export function DonationsPage() {
  return (
    <ResourceTablePage<DonationRecord>
      title="Donation Listings"
      description="Review surplus food donations and hide or remove inappropriate donation listings."
      fetcher={getDonations}
      emptyTitle="No donation listings found"
      emptyDescription="Try adjusting the search or status filter."
      filters={[
        {
          key: 'status',
          label: 'All statuses',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Reserved', value: 'reserved' },
            { label: 'Approved', value: 'approved' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
        },
      ]}
      columns={[
        { key: 'product', header: 'Donation', render: (donation) => donation.product?.crop_name ?? donation.description ?? `Donation #${donation.id}` },
        { key: 'farmer', header: 'Farmer', render: (donation) => donation.farmer?.name ?? 'Unknown' },
        { key: 'store', header: 'Store', render: (donation) => donation.store?.store_name ?? 'Unknown' },
        { key: 'quantity', header: 'Quantity', render: (donation) => `${formatNumber(donation.quantity)} ${donation.unit ?? ''}` },
        { key: 'status', header: 'Status', render: (donation) => <Badge tone={statusTone(donation.status)}>{titleCase(donation.status)}</Badge> },
        { key: 'created_at', header: 'Created', render: (donation) => formatDate(donation.created_at) },
      ]}
      actions={[
        {
          label: 'Hide',
          hidden: (donation) => donation.status === 'cancelled',
          confirmTitle: () => 'Hide this donation?',
          confirmDescription: () => 'The listing will be marked cancelled and removed from normal donation browsing.',
          onConfirm: (donation) => hideDonation(donation.id).then(() => undefined),
        },
        {
          label: 'Delete',
          variant: 'danger',
          confirmTitle: () => 'Delete this donation?',
          confirmDescription: () => 'This removes the donation listing. Use this for spam, duplicates, or inappropriate content.',
          onConfirm: (donation) => deleteDonation(donation.id).then(() => undefined),
        },
      ]}
    />
  );
}

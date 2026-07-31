import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatDate, titleCase } from '../lib/format';
import { getStores, suspendStore } from '../services/admin';
import type { StoreRecord } from '../types/api';

export function StoresPage() {
  return (
    <ResourceTablePage<StoreRecord>
      title="Stores"
      description="Review farmer store profiles and suspend stores that should not be visible."
      fetcher={getStores}
      emptyTitle="No stores found"
      emptyDescription="Try clearing filters or searching another district."
      filters={[
        {
          key: 'business_status',
          label: 'All business statuses',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
            { label: 'Temporarily Closed', value: 'temporarily_closed' },
          ],
        },
        {
          key: 'is_suspended',
          label: 'Suspension',
          options: [
            { label: 'Suspended', value: '1' },
            { label: 'Not Suspended', value: '0' },
          ],
        },
      ]}
      columns={[
        {
          key: 'store',
          header: 'Store',
          render: (store) => (
            <div>
              <p className="font-bold text-slate-950">{store.store_name ?? `Store #${store.id}`}</p>
              <p className="text-sm text-slate-500">{store.owner?.name ?? 'Unknown owner'}</p>
            </div>
          ),
        },
        { key: 'district', header: 'District', render: (store) => store.district ?? 'Not set' },
        { key: 'products', header: 'Products', render: (store) => store.harvest_listings_count ?? store.active_crop_count ?? 0 },
        { key: 'rating', header: 'Rating', render: (store) => store.average_rating ?? 'No ratings' },
        {
          key: 'status',
          header: 'Status',
          render: (store) => <Badge tone={store.is_suspended ? 'red' : statusTone(store.business_status)}>{store.is_suspended ? 'Suspended' : titleCase(store.business_status)}</Badge>,
        },
        { key: 'created_at', header: 'Created', render: (store) => formatDate(store.created_at) },
      ]}
      actions={[
        {
          label: 'Suspend',
          variant: 'danger',
          hidden: (store) => Boolean(store.is_suspended),
          confirmTitle: (store) => `Suspend ${store.store_name ?? 'this store'}?`,
          confirmDescription: () => 'This closes the store and marks it as suspended in the marketplace moderation records.',
          onConfirm: (store) => suspendStore(store.id).then(() => undefined),
        },
      ]}
    />
  );
}

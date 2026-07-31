import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatCurrency, formatDate, formatNumber, titleCase } from '../lib/format';
import { deleteProduct, getProducts, hideProduct } from '../services/admin';
import type { ProductRecord } from '../types/api';

export function ProductsPage() {
  return (
    <ResourceTablePage<ProductRecord>
      title="Harvest Products"
      description="Moderate marketplace produce listings and remove inappropriate or duplicate items."
      fetcher={getProducts}
      emptyTitle="No products found"
      emptyDescription="Try changing the search or selected product status."
      filters={[
        {
          key: 'status',
          label: 'All statuses',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Reserved', value: 'reserved' },
            { label: 'Sold', value: 'sold' },
            { label: 'Hidden', value: 'hidden' },
          ],
        },
      ]}
      columns={[
        {
          key: 'product',
          header: 'Product',
          render: (product) => (
            <div>
              <p className="font-bold text-slate-950">{product.crop_name ?? product.crop ?? `Product #${product.id}`}</p>
              <p className="text-sm text-slate-500">{product.crop_category ?? 'Uncategorized'}</p>
            </div>
          ),
        },
        { key: 'farmer', header: 'Farmer', render: (product) => product.farmer ?? 'Unknown' },
        { key: 'store', header: 'Store', render: (product) => product.farm ?? 'Unknown' },
        { key: 'quantity', header: 'Available', render: (product) => `${formatNumber(product.available_quantity)} ${product.unit ?? ''}` },
        { key: 'price', header: 'Price', render: (product) => `${formatCurrency(product.price_per_unit)} / ${product.unit ?? 'unit'}` },
        { key: 'status', header: 'Status', render: (product) => <Badge tone={statusTone(product.status)}>{product.status_label ?? titleCase(product.status)}</Badge> },
        { key: 'created_at', header: 'Created', render: (product) => formatDate(product.created_at) },
      ]}
      actions={[
        {
          label: 'Hide',
          hidden: (product) => product.status === 'hidden',
          confirmTitle: (product) => `Hide ${product.crop_name ?? product.crop ?? 'this product'}?`,
          confirmDescription: () => 'This removes the product from normal marketplace availability without deleting its records.',
          onConfirm: (product) => hideProduct(product.id).then(() => undefined),
        },
        {
          label: 'Delete',
          variant: 'danger',
          confirmTitle: (product) => `Delete ${product.crop_name ?? product.crop ?? 'this product'}?`,
          confirmDescription: () => 'This removes the product listing. Use this for spam, duplicate, or inappropriate content.',
          onConfirm: (product) => deleteProduct(product.id).then(() => undefined),
        },
      ]}
    />
  );
}

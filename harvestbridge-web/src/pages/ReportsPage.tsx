import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { formatDate, titleCase } from '../lib/format';
import { getReports } from '../services/admin';
import type { ReportRecord } from '../types/api';

export function ReportsPage() {
  return (
    <ResourceTablePage<ReportRecord>
      title="Reports"
      description="Review content reports submitted by platform users."
      fetcher={getReports}
      emptyTitle="No reports found"
      emptyDescription="Open, reviewed, resolved, and dismissed reports will appear here."
      filters={[
        {
          key: 'status',
          label: 'All statuses',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Reviewed', value: 'reviewed' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Dismissed', value: 'dismissed' },
          ],
        },
        {
          key: 'content_type',
          label: 'All content',
          options: [
            { label: 'Product', value: 'product' },
            { label: 'Store', value: 'store' },
            { label: 'Story', value: 'story' },
            { label: 'Donation', value: 'donation' },
            { label: 'Compost Listing', value: 'compost_listing' },
          ],
        },
      ]}
      columns={[
        {
          key: 'report',
          header: 'Report',
          render: (report) => (
            <div>
              <p className="font-bold text-slate-950">{report.reason ?? 'No reason provided'}</p>
              <p className="max-w-md truncate text-sm text-slate-500">{report.description ?? 'No description'}</p>
            </div>
          ),
        },
        { key: 'content', header: 'Content', render: (report) => titleCase(report.content_type) },
        { key: 'item', header: 'Item', render: (report) => report.reportable?.title ?? 'Unknown item' },
        { key: 'reporter', header: 'Reporter', render: (report) => report.reporter?.name ?? 'Unknown' },
        { key: 'status', header: 'Status', render: (report) => <Badge tone={statusTone(report.status)}>{titleCase(report.status)}</Badge> },
        { key: 'created_at', header: 'Created', render: (report) => formatDate(report.created_at) },
      ]}
    />
  );
}

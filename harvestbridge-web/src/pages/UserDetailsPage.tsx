import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { Badge, statusTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatNumber, titleCase } from '../lib/format';
import { getUser } from '../services/admin';

export function UserDetailsPage() {
  const { id } = useParams();
  const userId = Number(id);
  const { data: user, loading, error } = useAsyncData(() => getUser(userId), [userId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">User Profile</h1>
          <p className="mt-1 text-sm text-slate-600">Account details and platform activity.</p>
        </div>
        <Link to="/users">
          <Button variant="secondary">
            <ArrowLeft size={16} />
            Back to Users
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : user ? (
        <>
          <Card>
            <CardHeader title={user.name} description={user.email} />
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <Info label="Phone" value={user.phone ?? 'Not set'} />
              <Info label="District" value={user.district ?? 'Not set'} />
              <Info label="Address" value={user.address ?? 'Not set'} />
              <Info label="Role" value={<Badge tone="blue">{titleCase(user.role)}</Badge>} />
              <Info label="Status" value={<Badge tone={statusTone(user.status)}>{titleCase(user.status)}</Badge>} />
              <Info label="Email Verified" value={formatDate(user.email_verified_at)} />
              <Info label="Registered" value={formatDate(user.created_at)} />
              <Info label="Updated" value={formatDate(user.updated_at)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity Counts" />
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
              {Object.entries(user.counts ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titleCase(key)}</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">{formatNumber(value)}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}

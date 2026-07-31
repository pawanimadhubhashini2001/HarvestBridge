import { useAuth } from '../contexts/AuthContext';
import { titleCase } from '../lib/format';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Account and console preferences.</p>
      </div>
      <Card>
        <CardHeader title="Administrator Profile" />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
            <p className="mt-1 font-bold text-slate-950">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 font-bold text-slate-950">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
            <div className="mt-1">
              <Badge tone="green">{titleCase(user?.role)}</Badge>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 font-bold text-slate-950">{titleCase(user?.status)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { Link } from 'react-router-dom';

import { ResourceTablePage } from '../components/resources/ResourceTablePage';
import { Badge, statusTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate, titleCase } from '../lib/format';
import { activateUser, getUsers, suspendUser } from '../services/admin';
import type { AdminUser } from '../types/api';

export function UsersPage() {
  return (
    <ResourceTablePage<AdminUser>
      title="Users"
      description="Manage HarvestBridge farmer, consumer, NGO, and compost business accounts."
      fetcher={getUsers}
      emptyTitle="No users found"
      emptyDescription="Try changing the search or filter values."
      filters={[
        {
          key: 'role',
          label: 'All roles',
          options: [
            { label: 'Farmer', value: 'farmer' },
            { label: 'Consumer', value: 'consumer' },
            { label: 'NGO', value: 'ngo' },
            { label: 'Compost Business', value: 'compost_business' },
          ],
        },
        {
          key: 'status',
          label: 'All statuses',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Blocked', value: 'blocked' },
          ],
        },
      ]}
      columns={[
        {
          key: 'name',
          header: 'User',
          render: (user) => (
            <div>
              <Link to={`/users/${user.id}`} className="font-bold text-slate-950 hover:text-harvest-700">
                {user.name}
              </Link>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          ),
        },
        { key: 'phone', header: 'Phone', render: (user) => user.phone ?? 'Not set' },
        { key: 'district', header: 'District', render: (user) => user.district ?? 'Not set' },
        { key: 'role', header: 'Role', render: (user) => <Badge tone="blue">{titleCase(user.role)}</Badge> },
        { key: 'status', header: 'Status', render: (user) => <Badge tone={statusTone(user.status)}>{titleCase(user.status)}</Badge> },
        { key: 'created_at', header: 'Registered', render: (user) => formatDate(user.created_at) },
        {
          key: 'profile',
          header: 'Profile',
          render: (user) => (
            <Link to={`/users/${user.id}`}>
              <Button variant="secondary" className="h-9 px-3">View</Button>
            </Link>
          ),
        },
      ]}
      actions={[
        {
          label: 'Suspend',
          variant: 'danger',
          hidden: (user) => user.status !== 'active',
          confirmTitle: (user) => `Suspend ${user.name}?`,
          confirmDescription: () => 'This blocks the user from normal platform access until an administrator activates the account again.',
          onConfirm: (user) => suspendUser(user.id).then(() => undefined),
        },
        {
          label: 'Activate',
          hidden: (user) => user.status === 'active',
          confirmTitle: (user) => `Activate ${user.name}?`,
          confirmDescription: () => 'This restores normal platform access for the selected user account.',
          onConfirm: (user) => activateUser(user.id).then(() => undefined),
        },
      ]}
    />
  );
}

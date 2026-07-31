import {
  Activity,
  BarChart3,
  Building2,
  HeartHandshake,
  Leaf,
  Package,
  Search,
  ShoppingBasket,
  Store,
  Users,
} from 'lucide-react';

import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { StatCard } from '../components/ui/StatCard';
import { BarChart, LineChart } from '../components/ui/SimpleCharts';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, titleCase } from '../lib/format';
import { getAnalytics, getAuditLogs, getDashboard } from '../services/admin';

export function DashboardPage() {
  const { data, loading, error } = useAsyncData(async () => {
    const [dashboard, analytics, activity] = await Promise.all([
      getDashboard(),
      getAnalytics(),
      getAuditLogs({ per_page: 8 }),
    ]);

    return { dashboard, analytics, activity };
  }, []);

  const overview = data?.dashboard.overview ?? data?.analytics.overview ?? {};
  const roleCounts = Object.fromEntries(
    data?.analytics.users_by_role?.map((item) => [item.role, item.total]) ?? [],
  );

  const cards = [
    { label: 'Total Users', value: overview.total_users ?? data?.dashboard.users, icon: Users, accent: 'bg-sky-50 text-sky-700' },
    { label: 'Total Farmers', value: roleCounts.farmer, icon: Leaf },
    { label: 'Total Consumers', value: roleCounts.consumer, icon: ShoppingBasket, accent: 'bg-amber-50 text-amber-700' },
    { label: 'Total NGOs', value: roleCounts.ngo, icon: HeartHandshake, accent: 'bg-rose-50 text-rose-700' },
    { label: 'Compost Businesses', value: roleCounts.compost_business, icon: Building2, accent: 'bg-lime-50 text-lime-700' },
    { label: 'Total Stores', value: overview.total_stores ?? data?.dashboard.farms, icon: Store },
    { label: 'Harvest Products', value: overview.total_products, icon: Package, accent: 'bg-indigo-50 text-indigo-700' },
    { label: 'Available Products', value: overview.available_products, icon: Activity },
    { label: 'Sold Out Products', value: overview.sold_out_products, icon: Package, accent: 'bg-red-50 text-red-700' },
    { label: 'Hidden Products', value: overview.hidden_products ?? 0, icon: Package, accent: 'bg-slate-100 text-slate-700' },
    { label: 'Stories', value: overview.story_count, icon: BarChart3, accent: 'bg-violet-50 text-violet-700' },
    { label: 'Donation Listings', value: overview.donation_listings, icon: HeartHandshake, accent: 'bg-pink-50 text-pink-700' },
    { label: 'Compost Listings', value: overview.compost_listings, icon: Leaf, accent: 'bg-emerald-50 text-emerald-700' },
    { label: 'Nearby Searches', value: overview.nearby_searches, icon: Search, accent: 'bg-cyan-50 text-cyan-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-harvest-700">Operations</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          {data?.dashboard.generated_at ? `Updated ${formatDate(data.dashboard.generated_at)}` : 'Live admin overview'}
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader title="Monthly Registrations" />
              <div className="p-5">
                <LineChart data={data?.analytics.charts?.monthly_user_registrations ?? []} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Users by Role" />
              <div className="p-5">
                <BarChart
                  data={data?.analytics.users_by_role?.map((item) => ({
                    label: titleCase(item.role),
                    total: item.total,
                  })) ?? []}
                  labelKey="label"
                  valueKey="total"
                />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent Activity" />
            <div className="p-5">
              {data?.activity.items.length ? (
                <div className="divide-y divide-slate-100">
                  {data.activity.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{titleCase(item.action)}</p>
                        <p className="text-sm text-slate-500">{item.user?.name ?? 'System'}</p>
                      </div>
                      <p className="text-sm text-slate-500">{formatDate(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No recent activity" description="Audit activity will appear here when administrators or system jobs create it." />
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

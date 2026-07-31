import { BarChart3, HeartHandshake, Leaf, Package, Store, Users } from 'lucide-react';
import { useState } from 'react';

import { Card, CardHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { BarChart, LineChart, RankedBarChart } from '../components/ui/SimpleCharts';
import { StatCard } from '../components/ui/StatCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatCurrency, formatDate, formatNumber, titleCase } from '../lib/format';
import { getAnalytics } from '../services/admin';
import type { SalesPeriod } from '../types/api';

const salesPeriodOptions: Array<{ label: string; value: SalesPeriod }> = [
  { label: 'Monthly', value: 'monthly' },
  { label: '3 Months', value: 'three_months' },
  { label: 'Annual', value: 'annual' },
];

export function AnalyticsPage() {
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('monthly');
  const { data, loading, error } = useAsyncData(
    () => getAnalytics({ period: salesPeriod }),
    [salesPeriod],
  );
  const overview = data?.overview ?? {};
  const sellingAnalysis = data?.top_selling_analysis;
  const favoriteRate =
    data?.favorite_rate?.total_predictions && data.favorite_rate.total_predictions > 0
      ? Math.round(((data.favorite_rate.total_favorites ?? 0) / data.favorite_rate.total_predictions) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Platform performance, moderation trends, and marketplace activity.</p>
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
            <StatCard label="Registered Users" value={overview.total_users} icon={Users} accent="bg-sky-50 text-sky-700" />
            <StatCard label="Stores" value={overview.total_stores} icon={Store} />
            <StatCard label="Products" value={overview.total_products} icon={Package} accent="bg-indigo-50 text-indigo-700" />
            <StatCard label="Available Products" value={overview.available_products} icon={Package} />
            <StatCard label="Sold Out Products" value={overview.sold_out_products} icon={Package} accent="bg-red-50 text-red-700" />
            <StatCard label="Donation Listings" value={overview.donation_listings} icon={HeartHandshake} accent="bg-pink-50 text-pink-700" />
            <StatCard label="Compost Listings" value={overview.compost_listings} icon={Leaf} />
            <StatCard label="Favorite Rate" value={`${favoriteRate}%`} icon={BarChart3} accent="bg-amber-50 text-amber-700" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader title="Monthly Registrations" />
              <div className="p-5">
                <LineChart data={data?.charts?.monthly_user_registrations ?? []} />
              </div>
            </Card>
            <Card>
              <CardHeader title="Top Farmers" />
              <div className="p-5">
                <BarChart
                  data={data?.charts?.most_active_farmers?.map((item) => ({
                    label: item.farmer_name ?? 'Unknown',
                    total: item.activity_score ?? 0,
                  })) ?? []}
                  labelKey="label"
                  valueKey="total"
                />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Top Selling Crop Items"
              description={
                sellingAnalysis
                  ? `${sellingAnalysis.label} · ${formatDate(sellingAnalysis.from)} to ${formatDate(sellingAnalysis.to)}`
                  : 'Confirmed accepted and completed orders'
              }
              action={
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                  {salesPeriodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSalesPeriod(option.value)}
                      className={`h-9 rounded-md px-3 text-sm font-bold transition ${
                        salesPeriod === option.value
                          ? 'bg-harvest-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-950'
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="grid gap-5 p-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmed Quantity</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatNumber(sellingAnalysis?.total_quantity)} units
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatNumber(sellingAnalysis?.orders_count)} accepted/completed orders
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatCurrency(sellingAnalysis?.total_revenue)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Based on order item subtotals</p>
                </div>
              </div>
              <RankedBarChart
                data={
                  sellingAnalysis?.top_crops.map((crop) => ({
                    label: crop.crop_name,
                    value: Number(crop.total_quantity ?? 0),
                    valueLabel: `${formatNumber(crop.total_quantity)} units`,
                    secondaryLabel: `${formatCurrency(crop.total_revenue)} · ${formatNumber(crop.orders_count)} orders`,
                    meta: crop.crop_category ?? 'Uncategorized',
                  })) ?? []
                }
                emptyMessage="No confirmed crop sales found for this period."
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Farmer-wise Top Selling Crops"
              description="Compare which farmers are selling the most and their strongest crop item."
            />
            <div className="p-5">
              <RankedBarChart
                data={
                  sellingAnalysis?.farmer_breakdown.map((farmer) => ({
                    label: farmer.farmer_name,
                    value: Number(farmer.total_quantity ?? 0),
                    valueLabel: `${formatNumber(farmer.total_quantity)} units`,
                    secondaryLabel: `${formatCurrency(farmer.total_revenue)} · top crop: ${farmer.top_crop}`,
                    meta: farmer.store_name ?? 'No store name',
                  })) ?? []
                }
                emptyMessage="No farmer-wise confirmed sales found for this period."
              />
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader title="Estimated Sales" />
              <div className="p-5">
                <EmptyState
                  title="Sales data unavailable"
                  description="Sales data is unavailable because HarvestBridge supports offline transactions."
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Waste Saved" />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Donation Listings</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(overview.donation_listings)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compost Listings</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(overview.compost_listings)}</p>
                </div>
                <p className="sm:col-span-2 text-sm text-slate-500">
                  Quantity-based waste saved analytics will appear when the admin API returns donation and compost quantity aggregates.
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Users by Role" />
            <div className="p-5">
              <BarChart
                data={data?.users_by_role?.map((item) => ({ label: titleCase(item.role), total: item.total })) ?? []}
                labelKey="label"
                valueKey="total"
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

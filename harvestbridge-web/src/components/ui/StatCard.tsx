import type { LucideIcon } from 'lucide-react';

import { formatNumber } from '../../lib/format';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'bg-harvest-50 text-harvest-700',
}: {
  label: string;
  value: unknown;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(value)}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-md ${accent}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

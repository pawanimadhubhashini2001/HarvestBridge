import { formatNumber } from '../../lib/format';

export function BarChart({
  data,
  labelKey,
  valueKey,
}: {
  data: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] ?? 0)), 1);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No analytics data available.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = Number(item[valueKey] ?? 0);
        const width = Math.max((value / max) * 100, value > 0 ? 6 : 0);

        return (
          <div key={index} className="grid grid-cols-[minmax(110px,180px)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{String(item[labelKey] ?? 'Unknown')}</span>
            <div className="h-3 rounded-md bg-slate-100">
              <div className="h-3 rounded-md bg-harvest-600" style={{ width: `${width}%` }} />
            </div>
            <span className="min-w-10 text-right font-bold text-slate-900">{formatNumber(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RankedBarChart({
  data,
  emptyMessage = 'No analytics data available.',
}: {
  data: Array<{
    label: string;
    value: number;
    valueLabel: string;
    secondaryLabel?: string;
    meta?: string;
  }>;
  emptyMessage?: string;
}) {
  const max = Math.max(...data.map((item) => Number(item.value ?? 0)), 1);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const width = Math.max((item.value / max) * 100, item.value > 0 ? 7 : 0);

        return (
          <div key={`${item.label}-${index}`} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-harvest-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-950">{item.label}</p>
                  {item.meta ? <p className="mt-0.5 text-sm text-slate-500">{item.meta}</p> : null}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-base font-bold text-slate-950">{item.valueLabel}</p>
                {item.secondaryLabel ? <p className="text-sm text-slate-500">{item.secondaryLabel}</p> : null}
              </div>
            </div>
            <div className="h-4 overflow-hidden rounded-md bg-slate-100">
              <div className="h-full rounded-md bg-harvest-600" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({
  data,
}: {
  data: Array<{ label?: string; month?: string | null; total?: number }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No trend data available.</p>;
  }

  const width = 560;
  const height = 220;
  const padding = {
    top: 24,
    right: 16,
    bottom: 38,
    left: 20,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((item) => Number(item.total ?? 0)), 1);
  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (Number(item.total ?? 0) / max) * chartHeight;
    return { x, y, label: item.label ?? item.month ?? 'Unknown', total: Number(item.total ?? 0) };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const labelStep = data.length > 8 ? 2 : 1;

  return (
    <div className="overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight}
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <path d={path} fill="none" stroke="#24833b" strokeWidth="4" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
            {index % labelStep === 0 || index === points.length - 1 ? (
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500 text-[10px]">
                {point.label}
              </text>
            ) : null}
            <text x={point.x} y={Math.max(point.y - 10, 12)} textAnchor="middle" className="fill-slate-800 text-[11px] font-bold">
              {formatNumber(point.total)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

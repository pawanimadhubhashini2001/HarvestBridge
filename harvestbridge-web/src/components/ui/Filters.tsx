import { Search } from 'lucide-react';

import { Button } from './Button';

export interface FilterOption {
  label: string;
  value: string;
}

export function Filters({
  search,
  onSearchChange,
  filters = [],
  values,
  onFilterChange,
  onReset,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{ key: string; label: string; options: FilterOption[] }>;
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
      {onSearchChange ? (
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-harvest-500 focus:ring-2 focus:ring-harvest-100"
          />
        </label>
      ) : null}
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={values[filter.key] ?? ''}
          onChange={(event) => onFilterChange(filter.key, event.target.value)}
          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-harvest-500 focus:ring-2 focus:ring-harvest-100">
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <Button type="button" variant="secondary" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

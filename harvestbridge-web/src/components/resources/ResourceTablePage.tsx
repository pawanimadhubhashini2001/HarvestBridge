import { useEffect, useMemo, useState } from 'react';

import { getApiError } from '../../lib/api';
import type { ListParams } from '../../services/admin';
import type { PaginatedResult } from '../../types/api';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { ConfirmDialog, type ConfirmState } from '../ui/ConfirmDialog';
import { DataTable, Pagination, type TableColumn } from '../ui/DataTable';
import { Filters, type FilterOption } from '../ui/Filters';

interface ResourceAction<T> {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  confirmTitle: (row: T) => string;
  confirmDescription: (row: T) => string;
  onConfirm: (row: T) => Promise<void>;
  hidden?: (row: T) => boolean;
}

export function ResourceTablePage<T extends { id: number }>({
  title,
  description,
  columns,
  fetcher,
  filters = [],
  actions = [],
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  columns: Array<TableColumn<T>>;
  fetcher: (params: ListParams) => Promise<PaginatedResult<T>>;
  filters?: Array<{ key: string; label: string; options: FilterOption[] }>;
  actions?: Array<ResourceAction<T>>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const params = useMemo<ListParams>(
    () => ({
      search: search || undefined,
      page,
      per_page: 15,
      ...Object.fromEntries(Object.entries(filterValues).filter(([, value]) => value !== '')),
    }),
    [filterValues, page, search],
  );

  async function load() {
    setLoading(true);
    setError(null);

    try {
      setResult(await fetcher(params));
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  const actionColumn: TableColumn<T> | null =
    actions.length > 0
      ? {
          key: 'actions',
          header: 'Actions',
          className: 'text-right',
          render: (row) => (
            <div className="flex justify-end gap-2">
              {actions
                .filter((action) => !action.hidden?.(row))
                .map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant ?? 'secondary'}
                    className="h-9 px-3"
                    onClick={() =>
                      setConfirmState({
                        title: action.confirmTitle(row),
                        description: action.confirmDescription(row),
                        confirmLabel: action.label,
                        variant: action.variant === 'danger' ? 'danger' : 'primary',
                        onConfirm: async () => {
                          setActionBusy(true);
                          try {
                            await action.onConfirm(row);
                            setConfirmState(null);
                            await load();
                          } catch (requestError) {
                            setError(getApiError(requestError));
                          } finally {
                            setActionBusy(false);
                          }
                        },
                      })
                    }>
                    {action.label}
                  </Button>
                ))}
            </div>
          ),
        }
      : null;

  const visibleColumns = actionColumn ? [...columns, actionColumn] : columns;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <Card>
        <CardHeader title={title} description={`${result?.meta.total ?? 0} records`} />
        <Filters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filters={filters}
          values={filterValues}
          onFilterChange={(key, value) => {
            setFilterValues((current) => ({ ...current, [key]: value }));
            setPage(1);
          }}
          onReset={() => {
            setSearch('');
            setFilterValues({});
            setPage(1);
          }}
        />
        {error ? (
          <div className="mx-5 mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        <div className="px-5 pb-5">
          <DataTable
            rows={result?.items ?? []}
            columns={visibleColumns}
            loading={loading}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        </div>
        {result ? <Pagination meta={result.meta} onPageChange={setPage} /> : null}
      </Card>
      <ConfirmDialog state={confirmState} busy={actionBusy} onClose={() => setConfirmState(null)} />
    </div>
  );
}

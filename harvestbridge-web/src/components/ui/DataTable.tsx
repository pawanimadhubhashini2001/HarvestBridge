import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { PaginationMeta } from '../../types/api';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: Array<TableColumn<T>>;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="table-scroll overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`whitespace-nowrap px-4 py-3 font-bold ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-4 align-middle ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {meta.current_page} of {meta.last_page} · {meta.total} records
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}>
          <ChevronLeft size={16} />
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}>
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

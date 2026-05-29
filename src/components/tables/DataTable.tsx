import type { ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";
import { LoadingSkeleton } from "../common/LoadingSkeleton";

type Column = { key: string; header: string; render?: (row: any) => ReactNode };

export function DataTable({ columns, rows = [], loading, actions }: {
  columns: Column[];
  rows?: any[];
  loading?: boolean;
  actions?: (row: any) => React.ReactNode;
}) {
  if (loading) return <LoadingSkeleton />;
  if (!rows.length) return <EmptyState />;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-red-950/35">
      <div className="max-h-[65vh] overflow-auto">
        <table className="min-w-[720px] divide-y divide-slate-200 text-sm dark:divide-red-950/35 lg:min-w-full">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#171719]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                  {column.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-red-950/25 dark:bg-[#101012]">
            {rows.map((row) => (
              <tr key={row._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-[#1f1113]">
                {columns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700 transition-colors dark:text-slate-200 dark:group-hover:text-white">{column.render ? column.render(row) : row[column.key]}</td>)}
                {actions && <td className="px-4 py-3 text-right align-middle">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


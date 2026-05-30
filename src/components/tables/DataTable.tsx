import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";
import { LoadingSkeleton } from "../common/LoadingSkeleton";

type Column = { key: string; header: string; render?: (row: any) => ReactNode };

export function DataTable({ columns, rows = [], loading, actions }: {
  columns: Column[];
  rows?: any[];
  loading?: boolean;
  actions?: (row: any) => React.ReactNode;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [openMenuId]);

  if (loading) return <LoadingSkeleton />;
  if (!rows.length) return <EmptyState />;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-red-950/35">
      <div className="max-h-[65vh] overflow-auto">
        <table className="min-w-[640px] divide-y divide-slate-200 text-sm dark:divide-red-950/35 lg:min-w-full">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#171719]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-2.5 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
                  {column.header}
                </th>
              ))}
              {actions && <th className="w-24 whitespace-nowrap px-2 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-red-950/25 dark:bg-[#101012]">
            {rows.map((row) => (
              <tr key={row._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-[#1f1113]">
                {columns.map((column) => <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700 transition-colors dark:text-slate-200 dark:group-hover:text-white">{column.render ? column.render(row) : row[column.key]}</td>)}
                {actions && (
                  <td className="px-4 py-3 text-right align-middle">
                    <div className="relative inline-flex justify-end" ref={(node) => {
                      if (openMenuId === String(row._id)) {
                        menuRef.current = node;
                      }
                    }}>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-[#111114] dark:text-slate-300 dark:hover:bg-[#1b1b1f] dark:hover:text-white"
                        aria-label="Open row actions"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === String(row._id)}
                        onClick={() => setOpenMenuId((current) => current === String(row._id) ? null : String(row._id))}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === String(row._id) && (
                        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-[#111114] dark:shadow-black/40">
                          <div className="flex flex-col gap-2" onClick={() => setOpenMenuId(null)}>
                            {actions(row)}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


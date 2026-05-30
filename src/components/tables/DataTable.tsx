import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";
import { LoadingSkeleton } from "../common/LoadingSkeleton";

type Column = { key: string; header: string; render?: (row: any) => ReactNode };

export function DataTable({ columns, rows = [], loading, actions, actionCount }: {
  columns: Column[];
  rows?: any[];
  loading?: boolean;
  actions?: (row: any) => React.ReactNode;
  actionCount?: number;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<"up" | "down">("down");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!openMenuId) return;

    const computePlacement = () => {
      if (!triggerRef.current || !menuRef.current || !scrollRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();
      const spaceBelow = scrollRect.bottom - triggerRect.bottom;
      const spaceAbove = triggerRect.top - scrollRect.top;
      const openRowIndex = rows.findIndex((row, index) => String(row._id ?? row.id ?? index) === openMenuId);
      const nearBottomRow = openRowIndex >= Math.max(0, rows.length - 2);
      const openUp = nearBottomRow || (spaceBelow < menuRect.height + 24 && spaceAbove > menuRect.height + 24);
      setMenuDirection(openUp ? "up" : "down");
    };

    const frame = requestAnimationFrame(computePlacement);
    window.addEventListener("resize", computePlacement);
    scrollRef.current?.addEventListener("scroll", computePlacement, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", computePlacement);
      scrollRef.current?.removeEventListener("scroll", computePlacement);
    };
  }, [openMenuId, rows]);

  if (loading) return <LoadingSkeleton />;
  if (!rows.length) return <EmptyState />;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-red-950/35">
      <div ref={scrollRef} className="max-h-[65vh] overflow-auto">
        <table className="min-w-[640px] divide-y divide-slate-200 text-sm dark:divide-red-950/35 lg:min-w-full">
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-[#171719]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="relative whitespace-nowrap px-2.5 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">
                  {column.header}
                </th>
              ))}
              {actions && <th className="relative z-30 w-24 whitespace-nowrap px-2 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-red-950/25 dark:bg-[#101012]">
            {rows.map((row, index) => {
              const rowKey = String(row._id ?? row.id ?? index);

              return (
              <tr key={rowKey} className="group transition-colors hover:bg-slate-50 dark:hover:bg-[#1f1113]">
                {columns.map((column) => <td key={column.key} className="whitespace-nowrap px-2.5 py-2.5 text-slate-700 transition-colors dark:text-slate-200 dark:group-hover:text-white">{column.render ? column.render(row) : row[column.key]}</td>)}
                {actions && (
                  <td className="relative whitespace-nowrap px-2 py-2 text-right align-middle">
                    {actionCount !== undefined && actionCount > 2 ? (
                      <div className="relative inline-flex justify-end" ref={(node) => {
                        if (openMenuId === rowKey) {
                          menuRef.current = node;
                        }
                      }}>
                        <button
                          ref={(node) => {
                            if (openMenuId === rowKey) {
                              triggerRef.current = node;
                            }
                          }}
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-[#111114] dark:text-slate-300 dark:hover:bg-[#1b1b1f] dark:hover:text-white"
                          aria-label="Open row actions"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === rowKey}
                          onClick={() => setOpenMenuId((current) => current === rowKey ? null : rowKey)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === rowKey && (
                          <div
                            ref={(node) => {
                              if (openMenuId === rowKey) {
                                menuRef.current = node;
                              }
                            }}
                            onClick={(event) => event.stopPropagation()}
                            className={`absolute right-0 z-20 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-[#111114] dark:shadow-black/40 ${menuDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
                          >
                            <div className="flex flex-col gap-2">
                              {actions(row)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      actions(row)
                    )}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";
import { LoadingSkeleton } from "../common/LoadingSkeleton";
import { formatDisplayDate, shouldFormatAsDate } from "../../utils/formatDate";

type Column = { key: string; header: string; render?: (row: any) => ReactNode };
const MENU_ROW_HEIGHT = 54;

export function DataTable({ columns, rows = [], loading, loadingMessage, actions, actionCount, selectable, selectedIds, onToggleRow, onToggleAll }: {
  columns: Column[];
  rows?: any[];
  loading?: boolean;
  loadingMessage?: string;
  actions?: (row: any) => React.ReactNode;
  actionCount?: number;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: (ids: string[]) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<"up" | "down">("down");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
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
      const nearBottomRow = openRowIndex >= Math.max(0, rows.length - 3);
      const openUp = rows.length > 3 && (nearBottomRow || (spaceBelow < menuRect.height + 24 && spaceAbove > menuRect.height + 24));
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

  if (loading) return <LoadingSkeleton message={loadingMessage} />;
  if (!rows.length) return <EmptyState />;
  const rowIds = rows.map((row, index) => String(row._id ?? row.id ?? index));
  const selectedSet = new Set(selectedIds || []);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));
  const menuSpace = actionCount ? Math.max(190, actionCount * MENU_ROW_HEIGHT + 42) : 190;
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 dark:border-red-950/35">
      <div ref={scrollRef} style={{ paddingBottom: openMenuId && menuDirection === "down" ? menuSpace : undefined }} className="scrollbar-hidden max-h-[65vh] overflow-auto">
        <table className="min-w-[640px] divide-y divide-slate-200 text-[13px] dark:divide-red-950/35 lg:min-w-full">
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-[rgb(23,23,25)]">
            <tr>
              {selectable && (
                <th className="w-10 whitespace-nowrap px-2 py-1.5 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={allSelected}
                    onChange={() => onToggleAll?.(allSelected ? [] : rowIds)}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th key={column.key} className="relative whitespace-nowrap px-2 py-1.5 text-left font-semibold text-slate-600 dark:text-slate-300">
                  {column.header}
                </th>
              ))}
              {actions && <th className="relative z-30 w-20 whitespace-nowrap px-2 py-1.5 text-right font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-red-950/25 dark:bg-[#101012]">
            {rows.map((row, index) => {
              const rowKey = String(row._id ?? row.id ?? index);

              return (
              <tr key={rowKey} className="group transition-colors hover:bg-slate-50 dark:hover:bg-[#1f1113]">
                {selectable && (
                  <td className="w-10 whitespace-nowrap px-2 py-1.5">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selectedSet.has(rowKey)}
                      onChange={() => onToggleRow?.(rowKey)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-2 py-1.5 text-slate-700 transition-colors dark:text-slate-200 dark:group-hover:text-white">
                    {column.render ? column.render(row) : formatTableValue(column.key, row[column.key])}
                  </td>
                ))}
                {actions && (
                  <td className="relative whitespace-nowrap px-2 py-1.5 text-right align-middle">
                    {actionCount !== undefined && actionCount >= 2 ? (
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-[#111114] dark:text-slate-300 dark:hover:bg-[#1b1b1f] dark:hover:text-white"
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
                            className={`absolute right-0 z-50 w-[176px] rounded-lg border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-200/70 dark:border-red-950/45 dark:bg-[#111114] dark:shadow-black/40 ${menuDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
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

function formatTableValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return shouldFormatAsDate(key, value) ? formatDisplayDate(value) : String(value);
}

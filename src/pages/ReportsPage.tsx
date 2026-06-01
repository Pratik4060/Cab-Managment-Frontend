import { Columns3, Download, FileBarChart, Printer, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, renderPieLabelLine, renderPiePercentageLabel } from "../components/charts/PiePercentageLabel";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectReport } from "../redux/selectors";
import { fetchReportByType, fetchReports } from "../redux/slices/reportSlice";
import { downloadFile } from "../utils/downloadFile";

type ReportRow = Record<string, any>;
type ReportColumn = { key: string; header: string };
type VisibleColumns = Record<string, boolean>;
type ReportPeriod = "day" | "week" | "month" | "year";

const REPORT_TYPE = "invoices";
const reportBarColors = ["#ed1c24", "#111827", "#f59e0b", "#64748b", "#14b8a6", "#b50f16"];
const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
const tooltipCursor = { fill: "rgba(148, 163, 184, 0.14)", stroke: "transparent" };

function remainingAmount(invoice: any) {
  return Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0);
}

function paymentStatus(invoice: any) {
  return remainingAmount(invoice) === 0
    ? "Paid"
    : Number(invoice.paidAmount || 0) > 0
      ? "Partial"
      : "Pending";
}

export function ReportsPage() {
  const dispatch = useAppDispatch();
  const [filters, setFilters] = useState({ period: "month" as ReportPeriod, search: "", status: "" });
  const report = useAppSelector((state) => selectReport(state, REPORT_TYPE, filters));
  const loading = useAppSelector((state) => state.reports.loading);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({});
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchReportByType({ type: REPORT_TYPE, params: filters }));
  }, [dispatch, filters]);

  useEffect(() => {
    if (report?.columns) {
      setVisibleColumns(Object.fromEntries(report.columns.map((column: ReportColumn) => [column.key, true])));
    }
    setColumnMenuOpen(false);
  }, [report?.type]);

  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!columnMenuRef.current?.contains(event.target as Node)) setColumnMenuOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [columnMenuOpen]);

  const rows = useMemo<ReportRow[]>(() => (report?.rows || []).map((row: ReportRow, index: number) => ({
    _id: row._id || `${REPORT_TYPE}-${index}`,
    ...row,
    paymentStatus: row.paymentStatus || paymentStatus(row),
    remainingAmount: remainingAmount(row),
    balanceAmount: remainingAmount(row)
  })), [report?.rows]);

  const columns = ((report?.columns || []) as ReportColumn[]).filter((column) => visibleColumns[column.key] !== false);
  const exportQuery = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
  const summary = report?.summary || {};
  const trendData = report?.charts?.trend || [];
  const statusData = report?.charts?.status || [];

  const stats = useMemo(() => {
    const totalAmount = rows.reduce((sum, row) => sum + Number(row.finalAmount || 0), 0);
    const paidAmount = rows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
    const pendingAmount = rows.reduce((sum, row) => sum + (remainingAmount(row) > 0 ? remainingAmount(row) : 0), 0);
    return { totalAmount, paidAmount, pendingAmount };
  }, [rows]);

  function resetFilters() {
    const empty = { period: "month" as ReportPeriod, search: "", status: "" };
    setFilters(empty);
    dispatch(fetchReportByType({ type: REPORT_TYPE, params: empty }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Invoice Reports</h1>
          <p className="text-sm text-slate-500">Analytics, period filters, exports, print support, and invoice tables only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => downloadFile(`/reports/invoices/export.xlsx?${exportQuery}`, "invoice-reports.xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button className="btn-secondary" onClick={() => downloadFile(`/reports/invoices/export.pdf?${exportQuery}`, "invoice-reports.pdf")}>
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileBarChart} label="Invoice Count" value={summary.records ?? rows.length ?? 0} />
        <StatCard icon={FileBarChart} label="Paid Amount" value={`Rs ${Number(stats.paidAmount).toLocaleString()}`} tone="green" />
        <StatCard icon={FileBarChart} label="Pending" value={`Rs ${Number(stats.pendingAmount).toLocaleString()}`} tone="amber" />
        <StatCard icon={FileBarChart} label="Total Amount" value={`Rs ${Number(stats.totalAmount).toLocaleString()}`} />
      </div>

      <section className="panel p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Period Filters</h2>
          <button className="btn-secondary" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <select className="input w-32" value={filters.period} onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value as ReportPeriod }))}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <select className="input w-28" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <input className="input w-40" placeholder="Search invoices" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel p-3 xl:col-span-2">
          <h2 className="mb-1 text-[15px] font-semibold">Invoice Trend</h2>
          <p className="mb-3 text-xs text-slate-500">Period-wise invoice movement by amount</p>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" vertical={false} />
                <XAxis dataKey="_id" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {trendData.map((_: unknown, index: number) => <Cell key={index} fill={reportBarColors[index % reportBarColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </section>
        <section className="panel p-3">
          <h2 className="mb-1 text-[15px] font-semibold">Payment Status Split</h2>
          <p className="mb-3 text-xs text-slate-500">Invoice payment status distribution</p>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart margin={{ top: 18, right: 34, bottom: 18, left: 34 }}>
                <Pie data={statusData} dataKey="value" nameKey="_id" innerRadius={48} outerRadius={76} paddingAngle={5} label={renderPiePercentageLabel} labelLine={renderPieLabelLine}>
                  {statusData.map((_: unknown, index: number) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>

      <section className="panel p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Invoice Report Table</h2>
          <div className="relative" ref={columnMenuRef}>
            <button className="btn-secondary" type="button" onClick={() => setColumnMenuOpen((open) => !open)}>
              <Columns3 className="h-4 w-4" />
              Columns
            </button>
            {columnMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-[180px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Visible Columns</span>
                  <button
                    className="text-xs font-semibold text-brand-600"
                    type="button"
                    onClick={() => setVisibleColumns(Object.fromEntries(((report?.columns || []) as ReportColumn[]).map((column) => [column.key, true])))}
                  >
                    All
                  </button>
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {((report?.columns || []) as ReportColumn[]).map((column) => (
                    <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">
                      <input type="checkbox" checked={visibleColumns[column.key] !== false} onChange={(e) => setVisibleColumns((v) => ({ ...v, [column.key]: e.target.checked }))} />
                      <span className="text-slate-700 dark:text-slate-200">{column.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <DataTable loading={loading} rows={rows} columns={columns} />
      </section>
    </div>
  );
}

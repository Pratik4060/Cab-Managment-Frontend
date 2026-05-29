import { Columns3, Download, FileBarChart, Printer, RefreshCcw, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, renderPieLabelLine, renderPiePercentageLabel } from "../components/charts/PiePercentageLabel";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/common/StatCard";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectReport, selectReportSummary } from "../redux/selectors";
import { fetchReportByType, fetchReports } from "../redux/slices/reportSlice";
import { downloadFile } from "../utils/downloadFile";

type ReportRow = Record<string, any>;
type ReportColumn = { key: string; header: string };
type VisibleColumns = Record<string, boolean>;

const reportLabels: Record<string, string> = {
  "daily-trips": "Daily Trip Reports",
  drivers: "Driver Wise Reports",
  vehicles: "Vehicle Wise Reports",
  bookings: "Booking Reports",
  invoices: "Invoice Reports",
  payments: "Payment Reports",
  revenue: "Revenue Reports",
  "pending-payments": "Pending Payment Reports",
  gst: "GST Reports",
  utilization: "Utilization Reports",
  custom: "Custom Reports"
};

const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
const tooltipCursor = { fill: "rgba(148, 163, 184, 0.14)", stroke: "transparent" };

const recordLabels: Record<string, string> = {
  "daily-trips": "Total Trips",
  drivers: "Total Drivers",
  vehicles: "Total Vehicles",
  bookings: "Total Bookings",
  invoices: "Total Invoices",
  payments: "Payments",
  revenue: "Revenue Records",
  "pending-payments": "Pending Invoices",
  utilization: "Metrics",
  custom: "Custom Records"
};

export function ReportsPage() {
  const location = useLocation();
  const { type: routeType } = useParams();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const pathType = location.pathname.startsWith("/reports/") ? pathParts[pathParts.length - 1] : undefined;
  const type = routeType || pathType || "daily-trips";
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const current = useAppSelector((state) => selectReport(state, type));
  const data = useAppSelector(selectReportSummary);
  const loading = useAppSelector((state) => state.reports.loading);
  const [filters, setFilters] = useState({ from: "", to: "", search: "", status: "" });
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({});
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { dispatch(fetchReports()); }, [dispatch]);
  useEffect(() => { dispatch(fetchReportByType({ type, params: filters })); }, [dispatch, type]);
  useEffect(() => {
    if (current?.columns) setVisibleColumns(Object.fromEntries(current.columns.map((column: ReportColumn) => [column.key, true])));
    setColumnMenuOpen(false);
  }, [current?.type]);
  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!columnMenuRef.current?.contains(event.target as Node)) setColumnMenuOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [columnMenuOpen]);

  const rows = useMemo(() => {
    const search = filters.search.toLowerCase();
    return ((current?.rows || []) as ReportRow[]).filter((row) => !search || Object.values(row).join(" ").toLowerCase().includes(search));
  }, [current?.rows, filters.search]);
  const columns = ((current?.columns || []) as ReportColumn[]).filter((column) => visibleColumns[column.key] !== false);
  const exportQuery = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
  const summary = current?.summary || {};
  const trendData = current?.charts?.trend || [];
  const statusData = current?.charts?.status || [];

  function applyFilters() {
    dispatch(fetchReportByType({ type, params: filters }));
  }

  function resetFilters() {
    const empty = { from: "", to: "", search: "", status: "" };
    setFilters(empty);
    dispatch(fetchReportByType({ type, params: empty }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{current?.title || reportLabels[type] || "Reports"}</h1>
          <p className="text-sm text-slate-500">Analytics, filters, exports, print support, and responsive report tables.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-64" value={type} onChange={(event) => navigate(`/reports/${event.target.value}`)} aria-label="Select report type">
            {Object.entries(reportLabels).filter(([key]) => key !== "gst").map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={() => downloadFile(`/reports/${type}/export.xlsx?${exportQuery}`, `${type}.xlsx`)}><Download className="h-4 w-4" />Excel</button>
          <button className="btn-secondary" onClick={() => downloadFile(`/reports/${type}/export.pdf?${exportQuery}`, `${type}.pdf`)}><Download className="h-4 w-4" />PDF</button>
          <button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileBarChart} label={recordLabels[type] || "Records"} value={summary.records ?? data?.invoiceCount ?? 0} />
        <StatCard icon={FileBarChart} label="Total KM" value={summary.totalKm ?? 0} />
        <StatCard icon={FileBarChart} label="Revenue" value={`Rs ${Number(summary.totalRevenue ?? data?.revenue ?? 0).toLocaleString()}`} tone="green" />
        <StatCard icon={FileBarChart} label="Pending" value={`Rs ${Number(summary.pendingAmount ?? data?.outstanding ?? 0).toLocaleString()}`} tone="amber" />
      </div>

      <section className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Advanced Filters</h2>
          <button className="btn-secondary" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Reset</button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <input className="input" type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          <input className="input" type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          <input className="input md:col-span-2" placeholder="Global search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
          <button className="btn-primary" onClick={applyFilters}><RefreshCcw className="h-4 w-4" />Apply</button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel p-4 xl:col-span-2">
          <h2 className="mb-1 font-semibold">Trend Analytics</h2>
          <p className="mb-4 text-xs text-slate-500">Filtered report movement</p>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} /><Bar dataKey="value" fill="#ed1c24" radius={[6, 6, 0, 0]} maxBarSize={44} /></BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </section>
        <section className="panel p-4">
          <h2 className="mb-1 font-semibold">Status Split</h2>
          <p className="mb-4 text-xs text-slate-500">Current filtered distribution</p>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart margin={{ top: 18, right: 34, bottom: 18, left: 34 }}>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={5} label={renderPiePercentageLabel} labelLine={renderPieLabelLine}>
                  {statusData.map((_: unknown, index: number) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </section>
      </div>

      <section className="panel p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Report Table</h2>
          <div className="relative" ref={columnMenuRef}>
            <button className="btn-secondary" type="button" onClick={() => setColumnMenuOpen((open) => !open)}>
              <Columns3 className="h-4 w-4" />
              Columns
            </button>
            {columnMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-[160px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Visible Columns</span>
                  <button className="text-xs font-semibold text-brand-600" type="button" onClick={() => setVisibleColumns(Object.fromEntries(((current?.columns || []) as ReportColumn[]).map((column) => [column.key, true])))}>All</button>
                </div>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {((current?.columns || []) as ReportColumn[]).map((column) => (
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
        <DataTable loading={loading} rows={rows.map((row: ReportRow, index: number) => ({ _id: row._id || `${type}-${index}`, ...row }))} columns={columns} />
      </section>
    </div>
  );
}


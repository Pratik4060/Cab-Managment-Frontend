import { Banknote, ClipboardList, IndianRupee, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, renderPieLabelLine, renderPiePercentageLabel } from "../components/charts/PiePercentageLabel";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { StatCard } from "../components/common/StatCard";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectDashboardData } from "../redux/selectors";
import { fetchDashboard } from "../redux/slices/dashboardSlice";
type Period = "day" | "week" | "month" | "year";

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.dashboard.loading);
  const [period, setPeriod] = useState<Period>("month");
  const data = useAppSelector((state) => selectDashboardData(state, period));
  useEffect(() => { dispatch(fetchDashboard({ period })); }, [dispatch, period]);
  if (loading && !data) return <LoadingSkeleton rows={8} />;
  const cards = data?.cards || {};
  const bookingsPerDayChart = (data?.charts?.bookings || []).map((row) => ({ name: row._id, value: row.value }));
  const vehicleCompanyChart = (data?.charts?.vehicleCompany || []).map((row) => ({ name: row._id, value: row.value }));
  const periodLabel = periodOptions.find((option) => option.value === period)?.label || "Month";
  const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
  const tooltipCursor = { fill: "rgba(237, 28, 36, 0.08)" };
  const hasBookingChartData = bookingsPerDayChart.some((row) => Number(row.value) > 0);
  const hasVehicleChartData = vehicleCompanyChart.some((row) => Number(row.value) > 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">Unique Carz operations, billing, availability, and recent activity for this {periodLabel.toLowerCase()}.</p>
        </div>
        <select className="input w-32" value={period} onChange={(event) => setPeriod(event.target.value as Period)} aria-label="Dashboard time filter">
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Bookings" value={cards.totalBookings} />
        <StatCard icon={Route} label="Active Trips" value={cards.activeTrips} tone="amber" />
        <StatCard icon={IndianRupee} label="Revenue Summary" value={`₹ ${Number(cards.revenueSummary || 0).toLocaleString()}`} tone="green" />
        <StatCard icon={Banknote} label="Pending Payments" value={`₹ ${Number(cards.pendingPayments || 0).toLocaleString()}`} tone="amber" />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="panel p-3">
          <h2 className="mb-1 text-[15px] font-semibold">Bookings Per {periodLabel.toLowerCase()}</h2>
          <p className="mb-3 text-xs text-slate-500">Daily booking count for selected {periodLabel.toLowerCase()} filter</p>
          {hasBookingChartData ? (
            <ResponsiveContainer width="100%" height={238}>
              <BarChart data={bookingsPerDayChart} margin={{ top: 8, right: 12, bottom: 46, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-93} textAnchor="end" height={54} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} />
                <Bar dataKey="value" name="Bookings" radius={[8, 8, 0, 0]} maxBarSize={34}>
                  {bookingsPerDayChart.map((_, index) => <Cell key={index} fill={barColors[index % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmptyState />}
        </section>
        <section className="panel p-3">
          <h2 className="mb-1 text-[15px] font-semibold">Vehicle Company Split</h2>
          <p className="mb-3 text-xs text-slate-500">Fleet count by vehicle company</p>
          {hasVehicleChartData ? (
            <ResponsiveContainer width="100%" height={238}>
              <PieChart margin={{ top: 12, right: 34, bottom: 12, left: 34 }}>
                <Pie data={vehicleCompanyChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={5} label={renderPiePercentageLabel} labelLine={renderPieLabelLine}>
                  {vehicleCompanyChart.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartEmptyState />}
        </section>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="panel p-3">
          <h2 className="mb-2 text-[15px] font-semibold">Recent Bookings</h2>
          <DataTable rows={data?.recentBookings || []} columns={[{ key: "bookingId", header: "Booking" }, { key: "passengerName", header: "Passenger" }, { key: "status", header: "Status" }]} />
        </section>
        <section className="panel p-3">
          <h2 className="mb-2 text-[15px] font-semibold">Recent Invoices</h2>
          <DataTable rows={data?.recentInvoices || []} columns={[{ key: "invoiceNumber", header: "Invoice" }, { key: "status", header: "Status" }, { key: "finalAmount", header: "Amount", render: (r) => `₹ ${Number(r.finalAmount || 0).toLocaleString()}` }]} />
        </section>
      </div>
    </div>
  );
}

const periodOptions: { label: string; value: Period }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" }
];

const barColors = ["#ed1c24", "#111827", "#f59e0b", "#64748b", "#b50f16", "#14b8a6"];

function ChartEmptyState() {
  return (
    <div className="flex h-[238px] items-center justify-center rounded-lg border border-dashed border-brand-100 bg-brand-50/40 text-sm font-medium text-slate-500 dark:border-red-950/40 dark:bg-[#101012] dark:text-slate-400">
      Data not available
    </div>
  );
}

import { Banknote, ClipboardList, IndianRupee, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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
  const vehicleCompanyChart = (data?.charts?.vehicleCompany || []).map((row) => ({ name: row._id, value: row.value }));
  const periodLabel = periodOptions.find((option) => option.value === period)?.label || "Month";
  const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">Unique Carz operations, billing, availability, and recent activity for this {periodLabel.toLowerCase()}.</p>
        </div>
        <select className="input w-56" value={period} onChange={(event) => setPeriod(event.target.value as Period)} aria-label="Dashboard time filter">
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Bookings" value={cards.totalBookings} />
        <StatCard icon={Route} label="Active Trips" value={cards.activeTrips} tone="amber" />
        <StatCard icon={IndianRupee} label="Revenue Summary" value={`Rs ${Number(cards.revenueSummary || 0).toLocaleString()}`} tone="green" />
        <StatCard icon={Banknote} label="Pending Payments" value={`Rs ${Number(cards.pendingPayments || 0).toLocaleString()}`} tone="amber" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-4">
          <h2 className="mb-1 font-semibold">Vehicle Company Split</h2>
          <p className="mb-4 text-xs text-slate-500">Fleet count by vehicle company</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart margin={{ top: 18, right: 34, bottom: 18, left: 34 }}>
              <Pie data={vehicleCompanyChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={84} paddingAngle={5} label={renderPiePercentageLabel} labelLine={renderPieLabelLine}>
                {vehicleCompanyChart.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel p-4">
          <h2 className="mb-3 font-semibold">Recent Bookings</h2>
          <DataTable rows={data?.recentBookings || []} columns={[{ key: "bookingId", header: "Booking" }, { key: "passengerName", header: "Passenger" }, { key: "status", header: "Status" }]} />
        </section>
        <section className="panel p-4">
          <h2 className="mb-3 font-semibold">Recent Invoices</h2>
          <DataTable rows={data?.recentInvoices || []} columns={[{ key: "invoiceNumber", header: "Invoice" }, { key: "status", header: "Status" }, { key: "finalAmount", header: "Amount", render: (r) => `Rs ${Number(r.finalAmount || 0).toLocaleString()}` }]} />
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

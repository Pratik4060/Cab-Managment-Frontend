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
type ChartRow = { _id: string; value: number };

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.dashboard.loading);
  const [period, setPeriod] = useState<Period>("month");
  const data = useAppSelector((state) => selectDashboardData(state, period));
  
  useEffect(() => { dispatch(fetchDashboard({ period })); }, [dispatch, period]);
  
  if (loading && !data) return <LoadingSkeleton rows={8} />;
  
  const cards = data?.cards || {};
  const bookingsPerDayChart = (data?.charts?.bookings || []).map((row: ChartRow) => ({ name: row._id, value: row.value }));
  const vehicleCompanyChart = (data?.charts?.vehicleCompany || []).map((row: ChartRow) => ({ name: row._id, value: row.value }));
  const periodLabel = periodOptions.find((option) => option.value === period)?.label || "Month";
  
  const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
  const tooltipCursor = { fill: "rgba(237, 28, 36, 0.08)" };
  
  const hasBookingChartData = bookingsPerDayChart.some((row: { value: number }) => Number(row.value) > 0);
  const hasVehicleChartData = vehicleCompanyChart.some((row: { value: number }) => Number(row.value) > 0);
  
  return (
    <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Unique Carz operations, billing, availability, and recent activity for this {periodLabel.toLowerCase()}.
          </p>
        </div>
        <select 
          className="input w-full sm:w-32 text-sm sm:text-base" 
          value={period} 
          onChange={(event) => setPeriod(event.target.value as Period)} 
          aria-label="Dashboard time filter"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards Grid - Fully Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={ClipboardList} label="Total Bookings" value={cards.totalBookings} />
        <StatCard icon={Route} label="Active Trips" value={cards.activeTrips} tone="amber" />
        <StatCard icon={IndianRupee} label="Revenue Summary" value={`₹ ${Number(cards.revenueSummary || 0).toLocaleString()}`} tone="green" />
        <StatCard icon={Banknote} label="Pending Payments" value={`₹ ${Number(cards.pendingPayments || 0).toLocaleString()}`} tone="amber" />
      </div>

      {/* Charts Section - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Bookings Chart */}
        <section className="panel p-3 sm:p-4">
          <h2 className="mb-1 text-[14px] sm:text-[15px] font-semibold">Bookings Per {periodLabel.toLowerCase()}</h2>
          <p className="mb-2 sm:mb-3 text-[11px] sm:text-xs text-slate-500">Daily booking count for selected {periodLabel.toLowerCase()} filter</p>
          {hasBookingChartData ? (
            <div className="w-full h-[200px] sm:h-[220px] md:h-[238px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsPerDayChart} margin={{ top: 8, right: 8, bottom: 40, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0} 
                    angle={-65} 
                    textAnchor="end" 
                    height={50} 
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#64748b", fontSize: 10 }} 
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} />
                  <Bar dataKey="value" name="Bookings" radius={[6, 6, 0, 0]} maxBarSize={30}>
                    {bookingsPerDayChart.map((_: { name: string; value: number }, index: number) => <Cell key={index} fill={barColors[index % barColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </section>

        {/* Vehicle Company Chart */}
        <section className="panel p-3 sm:p-4">
          <h2 className="mb-1 text-[14px] sm:text-[15px] font-semibold">Vehicle Company Split</h2>
          <p className="mb-2 sm:mb-3 text-[11px] sm:text-xs text-slate-500">Fleet count by vehicle company</p>
          {hasVehicleChartData ? (
            <div className="w-full h-[200px] sm:h-[220px] md:h-[238px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 12, right: 20, bottom: 12, left: 20 }}>
                  <Pie 
                    data={vehicleCompanyChart} 
                    tabIndex={-1} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={35} 
                    outerRadius={65} 
                    paddingAngle={4} 
                    label={renderPiePercentageLabel} 
                    labelLine={renderPieLabelLine} 
                    style={{outline: "none"}}
                  >
                    {vehicleCompanyChart.map((_: { name: string; value: number }, index: number) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmptyState />}
        </section>
      </div>

      {/* Tables Section - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Bookings Table */}
        <section className="panel p-3 sm:p-4">
          <h2 className="mb-2 text-[14px] sm:text-[15px] font-semibold">Recent Bookings</h2>
          <div className="overflow-x-auto -mx-3 sm:-mx-4">
            <div className="min-w-[280px] px-3 sm:px-4">
              <DataTable 
                rows={data?.recentBookings || []} 
                columns={[
                  { key: "bookingId", header: "Booking" }, 
                  { key: "passengerName", header: "Passenger" }, 
                  { key: "status", header: "Status" }
                ]} 
              />
            </div>
          </div>
        </section>

        {/* Recent Invoices Table */}
        <section className="panel p-3 sm:p-4">
          <h2 className="mb-2 text-[14px] sm:text-[15px] font-semibold">Recent Invoices</h2>
          <div className="overflow-x-auto -mx-3 sm:-mx-4">
            <div className="min-w-[280px] px-3 sm:px-4">
              <DataTable 
                rows={data?.recentInvoices || []} 
                columns={[
                  { key: "invoiceNumber", header: "Invoice" }, 
                  { key: "status", header: "Status" }, 
                  { key: "finalAmount", header: "Amount", render: (r) => `₹ ${Number(r.finalAmount || 0).toLocaleString()}` }
                ]} 
              />
            </div>
          </div>
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
    <div className="flex h-[200px] sm:h-[220px] md:h-[238px] items-center justify-center rounded-lg border border-dashed border-brand-100 bg-brand-50/40 text-xs sm:text-sm font-medium text-slate-500 dark:border-red-950/40 dark:bg-[#101012] dark:text-slate-400">
      Data not available
    </div>
  );
}
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors, renderPieLabelLine, renderPiePercentageLabel } from "./PiePercentageLabel";

type Period = "day" | "week" | "month" | "year";
type ChartRow = { _id?: string; value?: number };
type DashboardChartPayload = { revenue?: ChartRow[]; trips?: ChartRow[]; bookings?: ChartRow[]; invoiceStatus?: ChartRow[] };
const normalize = (rows: ChartRow[] = []) => rows.map((row) => ({ name: row._id || "N/A", value: row.value || 0 }));
const periodCopy = {
  day: { revenue: "Hourly billing movement", trips: "Trips by hour", bookings: "Bookings by hour" },
  week: { revenue: "Daily billing movement this week", trips: "Trips by day", bookings: "Bookings by day" },
  month: { revenue: "Daily billing movement this month", trips: "Trips by day", bookings: "Bookings by day" },
  year: { revenue: "Monthly billing movement this year", trips: "Trips by month", bookings: "Bookings by month" }
};

export function DashboardCharts({ charts = {}, period = "month" }: { charts?: DashboardChartPayload; period?: Period }) {
  const revenue = normalize(charts.revenue);
  const trips = normalize(charts.trips);
  const bookings = normalize(charts.bookings);
  const status = normalize(charts.invoiceStatus);
  const copy = periodCopy[period] || periodCopy.month;
  const tooltipStyle = { borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)" };
  const tooltipCursor = { fill: "rgba(148, 163, 184, 0.14)", stroke: "transparent" };
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="panel p-4 xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-950 dark:text-white">Revenue Analytics</h3>
            <p className="text-xs text-slate-500">{copy.revenue}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ed1c24" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ed1c24" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} />
            <Area type="monotone" dataKey="value" stroke="#ed1c24" strokeWidth={3} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="panel p-4">
        <h3 className="mb-1 font-semibold text-slate-950 dark:text-white">Invoice Status</h3>
        <p className="mb-4 text-xs text-slate-500">Paid, pending, and overdue split</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ top: 18, right: 34, bottom: 18, left: 34 }}>
            <Pie data={status} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={5} label={renderPiePercentageLabel} labelLine={renderPieLabelLine}>
              {status.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="panel p-4 xl:col-span-2">
        <h3 className="mb-1 font-semibold text-slate-950 dark:text-white">Trip Analytics</h3>
        <p className="mb-4 text-xs text-slate-500">{copy.trips}</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trips}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} /><Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={42} /></BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel p-4">
        <h3 className="mb-1 font-semibold text-slate-950 dark:text-white">Booking Analytics</h3>
        <p className="mb-4 text-xs text-slate-500">{copy.bookings}</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bookings}><CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} /><Bar dataKey="value" fill="#ed1c24" radius={[6, 6, 0, 0]} maxBarSize={42} /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


import type { RootState } from "./store";

const rows = (state: RootState, key: "bookings" | "trips" | "drivers" | "vehicles" | "invoices") => state[key].allItems || state[key].items || [];

function groupCount(items: any[], key: string): { _id: string; value: number }[] {
  return Object.entries(items.reduce((acc, item) => {
    const label = item[key] || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([_id, value]) => ({ _id, value: Number(value) }));
}

function monthName(value: string) {
  return new Date(value).toLocaleString("en-IN", { month: "short" });
}

type DashboardPeriod = "day" | "week" | "month" | "year";
const dashboardNow = new Date("2026-06-01T09:00:00+05:30");
type ReportPeriod = DashboardPeriod;

function itemDate(item: any) {
  return new Date(item.paidAt || item.createdAt || item.updatedAt || Date.now());
}

function sortRecent(items: any[]) {
  return [...items].sort((a, b) => itemDate(b).getTime() - itemDate(a).getTime());
}

function isInPeriod(item: any, period: DashboardPeriod) {
  const date = itemDate(item);
  const now = dashboardNow;
  if (Number.isNaN(date.getTime())) return false;

  if (period === "day") {
    return date.toDateString() === now.toDateString();
  }

  if (period === "week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    return date >= weekStart && date <= now;
  }

  if (period === "month") {
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 29);
    monthStart.setHours(0, 0, 0, 0);
    return date >= monthStart && date <= now;
  }

  const yearStart = new Date(now);
  yearStart.setDate(now.getDate() - 364);
  yearStart.setHours(0, 0, 0, 0);
  return date >= yearStart && date <= now;
}

function periodLabel(value: string, period: DashboardPeriod) {
  const date = new Date(value);
  if (period === "day") return date.toLocaleTimeString("en-IN", { hour: "2-digit", hour12: true });
  if (period === "year") return monthName(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function trend(items: any[], valuePicker: (item: any) => number, period: DashboardPeriod = "month"): { _id: string; value: number }[] {
  const grouped = items.reduce((acc, item) => {
    const sourceDate = item.paidAt || item.createdAt || item.updatedAt;
    const label = sourceDate ? periodLabel(sourceDate, period) : "Current";
    acc[label] = (acc[label] || 0) + valuePicker(item);
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(grouped).map(([_id, value]) => ({ _id, value: Number(value) }));
}

function invoiceRemainingAmount(invoice: any) {
  return Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0);
}

function invoicePaymentStatus(invoice: any) {
  return invoiceRemainingAmount(invoice) === 0
    ? "Paid"
    : Number(invoice.paidAmount || 0) > 0
      ? "Partial"
      : "Pending";
}

function reportInPeriod(item: any, period: ReportPeriod) {
  return isInPeriod(item, period);
}

export function selectDashboardData(state: RootState, period: DashboardPeriod = "month") {
  const allBookings = rows(state, "bookings");
  const allTrips = rows(state, "trips");
  const allDrivers = rows(state, "drivers");
  const allVehicles = rows(state, "vehicles");
  const allInvoices = rows(state, "invoices");

  const bookings = allBookings.filter((item) => isInPeriod(item, period));
  const trips = allTrips.filter((item) => isInPeriod(item, period));
  const drivers = allDrivers.filter((item) => isInPeriod(item, period));
  const vehicles = allVehicles.filter((item) => isInPeriod(item, period));
  const invoices = allInvoices.filter((item) => isInPeriod(item, period));
  const payments = (state.payments.items || []).filter((item) => isInPeriod(item, period));
  const pendingInvoices = invoices.filter((invoice) => invoicePaymentStatus(invoice) === "Pending");

  return {
    cards: {
      totalBookings: bookings.length,
      activeTrips: trips.filter((trip) => trip.status === "Assigned").length,
      completedTrips: 0,
      pendingInvoices: pendingInvoices.length,
      revenueSummary: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      pendingPayments: pendingInvoices.reduce((sum, invoice) => sum + invoiceRemainingAmount(invoice), 0),
      availableDrivers: drivers.filter((driver) => driver.status === "Available").length,
      availableCars: vehicles.filter((vehicle) => vehicle.status === "Available").length
    },
    charts: {
      revenue: trend(payments, (payment) => Number(payment.amount || 0), period),
      trips: trend(trips, () => 1, period),
      bookings: trend(bookings, () => 1, period),
      vehicleCompany: groupCount(vehicles, "vehicleType"),
      invoiceStatus: groupCount(invoices, "status")
    },
    recentBookings: sortRecent(allBookings).slice(0, 5),
    recentInvoices: sortRecent(allInvoices).slice(0, 5)
  };
}

const reportColumns: Record<string, { key: string; header: string }[]> = {
  "daily-trips": [
    { key: "tripNumber", header: "Trip" }, { key: "status", header: "Status" }, { key: "totalKm", header: "KM" }, { key: "driverName", header: "Driver" }, { key: "vehicle", header: "Vehicle" }
  ],
  drivers: [
    { key: "driverName", header: "Driver" }, { key: "contactNumber", header: "Contact" }, { key: "status", header: "Status" }, { key: "licenseNumber", header: "License" }
  ],
  vehicles: [
    { key: "registrationNumber", header: "Registration" }, { key: "vehicleType", header: "Company" }, { key: "vehicleModel", header: "Model" }, { key: "cabType", header: "Cab Type" }
  ],
  bookings: [
    { key: "bookingId", header: "Booking" }, { key: "passengerName", header: "Passenger" }, { key: "businessUnit", header: "Client" }, { key: "status", header: "Status" }
  ],
  invoices: [
    { key: "invoiceNumber", header: "Invoice" }, { key: "clientName", header: "Client" }, { key: "status", header: "Status" }, { key: "paymentStatus", header: "Payment Status" }, { key: "finalAmount", header: "Total" }, { key: "remainingAmount", header: "Balance" }
  ],
  payments: [
    { key: "invoiceNumber", header: "Invoice" }, { key: "amount", header: "Amount" }, { key: "method", header: "Method" }, { key: "referenceNumber", header: "Reference" }
  ]
};

export function selectReport(state: RootState, type: string, params: Record<string, any> = {}) {
  const bookings = rows(state, "bookings");
  const trips = rows(state, "trips");
  const drivers = rows(state, "drivers");
  const vehicles = rows(state, "vehicles");
  const invoices = rows(state, "invoices");
  const payments = state.payments.items || [];
  const period = (params.period as ReportPeriod) || null;
  const search = String(params.search || "").toLowerCase();
  const statusFilter = String(params.status || "");
  const filterByPeriod = (items: any[]) => period ? items.filter((item) => reportInPeriod(item, period)) : items;
  const filterSearch = (items: any[]) => !search ? items : items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(search));

  const data: Record<string, any[]> = {
    "daily-trips": trips.map((trip) => ({ ...trip, driverName: trip.driver?.driverName, vehicle: trip.vehicle?.registrationNumber })),
    drivers,
    vehicles,
    bookings,
    invoices: invoices.map((invoice) => ({
      ...invoice,
      remainingAmount: invoiceRemainingAmount(invoice),
      balanceAmount: invoiceRemainingAmount(invoice),
      paymentStatus: invoicePaymentStatus(invoice),
      status: invoicePaymentStatus(invoice)
    })),
    payments,
    revenue: payments,
    "pending-payments": invoices.filter((invoice) => invoicePaymentStatus(invoice) === "Pending"),
    utilization: vehicles.map((vehicle) => ({ ...vehicle, utilization: vehicle.status === "Available" ? 35 : 0 })),
    custom: [...bookings, ...trips].slice(0, 20)
  };
  let selectedRows = data[type] || data["daily-trips"] || [];
  selectedRows = filterByPeriod(selectedRows);
  selectedRows = filterSearch(selectedRows);
  if (statusFilter) selectedRows = selectedRows.filter((row) => String(row.status) === statusFilter);
  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingAmount = filterByPeriod(invoices).reduce((sum, invoice) => sum + (invoiceRemainingAmount(invoice) > 0 ? invoiceRemainingAmount(invoice) : 0), 0);

  return {
    type,
    title: type.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    columns: reportColumns[type] || Object.keys(selectedRows[0] || {}).slice(0, 5).map((key) => ({ key, header: key })),
    rows: selectedRows,
    summary: {
      records: selectedRows.length,
      totalKm: filterByPeriod(trips).reduce((sum, trip) => sum + Number(trip.totalKm || 0), 0),
      totalRevenue,
      pendingAmount
    },
    charts: {
      trend: trend(selectedRows, (item) => Number(item.amount || item.finalAmount || 1)),
      status: groupCount(selectedRows, "status")
    }
  };
}

export function selectReportSummary(state: RootState) {
  const invoices = rows(state, "invoices");
  const payments = state.payments.items || [];
  return {
    invoiceCount: invoices.length,
    revenue: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    outstanding: invoices.reduce((sum, invoice) => sum + (invoiceRemainingAmount(invoice) > 0 ? invoiceRemainingAmount(invoice) : 0), 0)
  };
}

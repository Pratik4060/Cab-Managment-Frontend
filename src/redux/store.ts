import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import bookingReducer, { bookingActions } from "./slices/bookingSlice";
import tripReducer, { assignTrip, tripActions, updateTripStatus } from "./slices/tripSlice";
import vehicleReducer, { vehicleActions } from "./slices/vehicleSlice";
import driverReducer, { driverActions } from "./slices/driverSlice";
import invoiceReducer, { applyPayment } from "./slices/invoiceSlice";
import paymentReducer, { addPayment } from "./slices/paymentSlice";
import adminReducer from "./slices/adminSlice";
import reportReducer from "./slices/reportSlice";
import analyticsReducer from "./slices/analyticsSlice";
import themeReducer from "./slices/themeSlice";
import { readStorage, storageKeys, writeStorage } from "./localStorage";
import { seedAdmins, seedBookings, seedDrivers, seedInvoices, seedPayments, seedTrips, seedVehicles } from "./seedData";

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  bookings: bookingReducer,
  trips: tripReducer,
  vehicles: vehicleReducer,
  drivers: driverReducer,
  invoices: invoiceReducer,
  payments: paymentReducer,
  admins: adminReducer,
  reports: reportReducer,
  analytics: analyticsReducer,
  theme: themeReducer
});

export type RootState = ReturnType<typeof rootReducer>;

const entityState = (items: any[]) => ({ items, allItems: items, total: items.length, page: 1, pages: 1, loading: false, error: null, filter: {} });
const listenerMiddleware = createListenerMiddleware();
const cabTypeOptions = ["Hatchback", "Sedan", "SUV", "MUV/MPV"];
const companyFallbacks = ["Toyota", "Maruti Suzuki", "Honda", "Hyundai", "Tata", "Mahindra", "Kia"];
const modelFallbacks = ["Etios", "Dzire", "City", "Aura", "Nexon", "XUV700", "Carens"];
const presentationNow = new Date("2026-06-01T09:00:00+05:30");
const presentationDays = [0, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22, 27, 34, 45, 60, 90, 130, 180, 250];

function presentationIso(index: number, hour = 9) {
  const date = new Date(presentationNow);
  date.setDate(date.getDate() - (presentationDays[index] ?? index));
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function normalizeVehicles(items: any[]) {
  return items.map((vehicle, index) => {
    const legacyType = ["SUV", "Sedan", "Hatchback", "MUV/MPV"].includes(vehicle.vehicleType);
    const cabType = vehicle.cabType || (legacyType ? vehicle.vehicleType : cabTypeOptions[index % cabTypeOptions.length]);
    return {
      ...vehicle,
      vehicleType: legacyType || !vehicle.vehicleType ? companyFallbacks[index % companyFallbacks.length] : vehicle.vehicleType,
      vehicleModel: legacyType || !vehicle.vehicleModel ? modelFallbacks[index % modelFallbacks.length] : String(vehicle.vehicleModel).replace(/^(Toyota|Maruti|Maruti Suzuki|Honda|Hyundai|Tata|Mahindra|Kia)\s+/i, ""),
      cabType,
      createdAt: presentationIso(index)
    };
  });
}

function normalizeBookings(items: any[]) {
  return items.map((booking, index) => ({
    ...booking,
    bookingId: String(booking.bookingId || `TRP-2026-${String(index + 1).padStart(4, "0")}`).replace(/^BKG-/i, "TRP-"),
    status: String(booking._id || "").startsWith("trp-req-") && index < 20 ? "Assigned" : (booking.status || "New"),
    travelStartDate: booking.travelStartDate || "",
    travelEndDate: booking.travelEndDate || "",
    departmentName: booking.departmentName || "",
    projectExpenses: booking.projectExpenses || "No",
    costCenterOfProject: booking.costCenterOfProject || "",
    bookedBy: booking.bookedBy || booking.passengerName || "",
    purposeOfCabBooking: booking.purposeOfCabBooking || "",
    employeeCount: booking.employeeCount || 1,
    createdAt: presentationIso(index, 8 + (index % 8))
  }));
}

function normalizeDrivers(items: any[]) {
  return items.map((driver, index) => ({
    ...driver,
    aadhaarNumber: driver.aadhaarNumber || `42${String(1000000000 + index * 17391).padStart(10, "0")}`,
    panNumber: driver.panNumber || `ABCDE${String(1000 + index)}F`,
    aadhaarCardPhoto: driver.aadhaarCardPhoto || "",
    panCardPhoto: driver.panCardPhoto || "",
    licensePhoto: driver.licensePhoto || "",
    createdAt: presentationIso(index)
  }));
}

function normalizeInvoices(items: any[]) {
  return items.map((invoice, index) => {
    const remainingAmount = Number(invoice.remainingAmount ?? invoice.balanceAmount ?? Math.max(0, Number(invoice.finalAmount || 0) - Number(invoice.paidAmount || 0)));
    const paidAmount = Number(invoice.paidAmount || 0);
    const hasCostCenter = Boolean(String(invoice.booking?.costCenterOfProject ?? "").trim());
    const projectType = normalizeProjectType(invoice.projectType ?? (hasCostCenter ? "Management" : "Process"));
    return {
      ...invoice,
      projectType,
      billingAddress: invoice.billingAddress || invoice.trip?.billingAddress || invoice.booking?.reportingAddress || invoice.booking?.dropAddress || "",
      remainingAmount,
      balanceAmount: remainingAmount,
      paymentStatus: invoice.paymentStatus || (remainingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"),
      tripFare: Number(invoice.tripFare || 0),
      tollCharges: Number(invoice.tollCharges || invoice.trip?.tollCharges || 0),
      parkingCharges: Number(invoice.parkingCharges || invoice.trip?.parkingCharges || 0),
      extraCharges: Number(invoice.extraCharges || invoice.trip?.extraCharges || 0),
      gstPercent: Number(invoice.gstPercent ?? 5),
      gstAmount: Number(invoice.gstAmount || 0),
      subtotal: Number(invoice.subtotal || 0),
      finalAmount: Number(invoice.finalAmount || 0),
      createdAt: presentationIso(index),
      sentAt: invoice.sentAt || presentationIso(index, 10)
    };
  });
}

function normalizeTrips(items: any[]) {
  return items.map((trip, index) => ({
    ...trip,
    createdAt: presentationIso(index),
    timeOut: trip.timeOut || presentationIso(index, 9),
    timeIn: trip.timeIn || presentationIso(index, 13),
    booking: trip.booking ? { ...trip.booking, createdAt: presentationIso(index, 8 + (index % 8)) } : trip.booking
  }));
}

function normalizePayments(items: any[]) {
  return items.map((payment, index) => ({
    ...payment,
    paidAt: presentationIso(index, 16),
    createdAt: presentationIso(index, 16)
  }));
}

function normalizeAdmins(items: any[]) {
  return items.map((admin) => ({ ...admin, isActive: admin.isActive ?? true }));
}

function withSeedMinimum(items: any[], seed: any[], minimum: number) {
  if (items.length >= minimum) return items;
  const existingIds = new Set(items.map((item) => item._id || item.id));
  const missingSeed = seed.filter((item) => !existingIds.has(item._id || item.id));
  return [...items, ...missingSeed].slice(0, Math.max(minimum, items.length));
}

listenerMiddleware.startListening({
  actionCreator: assignTrip,
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const booking = state.bookings.allItems.find((item) => item._id === action.payload.bookingId);
    const driver = state.drivers.allItems.find((item) => item._id === action.payload.driverId);
    const vehicle = state.vehicles.allItems.find((item) => item._id === action.payload.vehicleId);
    const latestTrip = state.trips.allItems[0];
    if (latestTrip) listenerApi.dispatch(tripActions.updateOne({ id: latestTrip._id, payload: { booking, driver, vehicle } }));
    listenerApi.dispatch(bookingActions.updateOne({ id: action.payload.bookingId, payload: { status: "Assigned" } }));
    listenerApi.dispatch(driverActions.updateOne({ id: action.payload.driverId, payload: { status: "In Trip" } }));
    listenerApi.dispatch(vehicleActions.updateOne({ id: action.payload.vehicleId, payload: { status: "In Trip" } }));
  }
});

listenerMiddleware.startListening({
  actionCreator: updateTripStatus,
  effect: () => {}
});

listenerMiddleware.startListening({
  actionCreator: addPayment,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(applyPayment({ invoiceId: action.payload.invoiceId, amount: Number(action.payload.amount || 0) }));
  }
});

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    bookings: entityState(normalizeBookings(withSeedMinimum(readStorage(storageKeys.bookings, seedBookings), seedBookings, seedBookings.length))),
    trips: entityState(normalizeTrips(withSeedMinimum(readStorage(storageKeys.trips, seedTrips), seedTrips, seedTrips.length))),
    vehicles: entityState(normalizeVehicles(readStorage(storageKeys.vehicles, seedVehicles))),
    drivers: entityState(normalizeDrivers(withSeedMinimum(readStorage(storageKeys.drivers, seedDrivers), seedDrivers, seedDrivers.length))),
    invoices: entityState(normalizeInvoices(readStorage(storageKeys.invoices, seedInvoices))),
    payments: { items: normalizePayments(readStorage(storageKeys.payments, seedPayments)), loading: false, error: null },
    admins: entityState(normalizeAdmins(withSeedMinimum(readStorage(storageKeys.admins, seedAdmins), seedAdmins, seedAdmins.length))),
    dashboard: { data: readStorage(storageKeys.dashboard, null), loading: false, error: null, period: "month" }
  } as Partial<RootState>,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware as any)
});

store.subscribe(() => {
  const state = store.getState();
  writeStorage(storageKeys.bookings, state.bookings.allItems);
  writeStorage(storageKeys.trips, state.trips.allItems);
  writeStorage(storageKeys.drivers, state.drivers.allItems);
  writeStorage(storageKeys.vehicles, state.vehicles.allItems);
  writeStorage(storageKeys.invoices, state.invoices.allItems);
  writeStorage(storageKeys.payments, state.payments.items);
  writeStorage(storageKeys.admins, state.admins.allItems);
  writeStorage(storageKeys.dashboard, state.dashboard.data);
});

export type AppDispatch = typeof store.dispatch;

function normalizeProjectType(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase() === "management"
    ? "Management"
    : "Process";
}

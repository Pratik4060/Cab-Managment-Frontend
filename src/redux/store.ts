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
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const trip = state.trips.allItems.find((item) => item._id === action.payload.id);
    if (!trip) return;
    if (action.payload.payload.status === "Cancelled") {
      listenerApi.dispatch(bookingActions.updateOne({ id: trip.bookingId, payload: { status: "Cancelled" } }));
      listenerApi.dispatch(driverActions.updateOne({ id: trip.driverId, payload: { status: "Available" } }));
      listenerApi.dispatch(vehicleActions.updateOne({ id: trip.vehicleId, payload: { status: "Available" } }));
    }
    if (action.payload.payload.status === "Completed") {
      listenerApi.dispatch(driverActions.updateOne({ id: trip.driverId, payload: { status: "Available" } }));
      listenerApi.dispatch(vehicleActions.updateOne({ id: trip.vehicleId, payload: { status: "Available" } }));
    }
  }
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
    bookings: entityState(readStorage(storageKeys.bookings, seedBookings)),
    trips: entityState(readStorage(storageKeys.trips, seedTrips)),
    vehicles: entityState(readStorage(storageKeys.vehicles, seedVehicles)),
    drivers: entityState(readStorage(storageKeys.drivers, seedDrivers)),
    invoices: entityState(readStorage(storageKeys.invoices, seedInvoices)),
    payments: { items: readStorage(storageKeys.payments, seedPayments), loading: false, error: null },
    admins: entityState(readStorage(storageKeys.admins, seedAdmins)),
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

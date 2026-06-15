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

const listenerMiddleware = createListenerMiddleware();
purgeOperationalStorage();

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
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware)
});

export type AppDispatch = typeof store.dispatch;

function purgeOperationalStorage() {
  if (typeof localStorage === "undefined") return;
  [
    "cab_admin_bookings",
    "cab_admin_trips",
    "cab_admin_drivers",
    "cab_admin_vehicles",
    "cab_admin_invoices",
    "cab_admin_payments",
    "cab_admin_admins",
    "cab_admin_dashboard"
  ].forEach((key) => localStorage.removeItem(key));
}

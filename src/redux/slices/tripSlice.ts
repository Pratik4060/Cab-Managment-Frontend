import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { applyFilter } from "./createEntitySlice";

type TripState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  filter: Record<string, any>;
};

const initialState: TripState = {
  items: [],
  allItems: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  filter: {}
};

function refresh(state: TripState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.loading = false;
}

function nextTripNumber(items: any[]) {
  return `TRP-2026-${String(items.length + 1).padStart(4, "0")}`;
}

function calculateTotalKm(payload: any) {
  const kmOut = Number(payload.kmOut || 0);
  const kmIn = Number(payload.kmIn || 0);
  return kmIn >= kmOut && kmOut > 0 ? kmIn - kmOut : Number(payload.totalKm || 0);
}

const tripSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    fetchAll(state, action: PayloadAction<Record<string, any> | undefined>) {
      state.filter = action.payload || {};
      refresh(state);
    },
    setItems(state, action: PayloadAction<any[]>) {
      state.allItems = action.payload;
      refresh(state);
    },
    assignTrip(state, action: PayloadAction<any>) {
        const trip = {
          _id: `trp-${Date.now()}`,
          tripNumber: nextTripNumber(state.allItems),
          status: "Assigned",
          totalKm: 0,
          tollCharges: 0,
          parkingCharges: 0,
          extraCharges: 0,
          createdAt: new Date().toISOString(),
          ...action.payload
        };
        state.allItems.unshift(trip);
        refresh(state);
    },
    updateTripStatus(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.allItems = state.allItems.map((trip) => {
        if (trip._id !== action.payload.id) return trip;
        const payload = action.payload.payload;
        return {
          ...trip,
          ...payload,
          status: "Assigned",
          totalKm: calculateTotalKm({ ...trip, ...payload }),
          updatedAt: new Date().toISOString()
        };
      });
      refresh(state);
    },
    completeTrip(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.allItems = state.allItems.map((trip) => (
        trip._id === action.payload.id
          ? { ...trip, ...action.payload.payload, status: "Assigned", totalKm: calculateTotalKm({ ...trip, ...action.payload.payload }), updatedAt: new Date().toISOString() }
          : trip
      ));
      refresh(state);
    },
    updateOne(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.allItems = state.allItems.map((trip) => trip._id === action.payload.id ? { ...trip, ...action.payload.payload } : trip);
      refresh(state);
    },
    deleteOne(state, action: PayloadAction<string>) {
      state.allItems = state.allItems.filter((trip) => trip._id !== action.payload);
      refresh(state);
    },
    hydrateTripRelations(state, action: PayloadAction<{ bookings: any[]; drivers: any[]; vehicles: any[] }>) {
      state.allItems = state.allItems.map((trip, index) => {
        const booking = action.payload.bookings.find((item) => item._id === trip.bookingId) || trip.booking;
        const driver = action.payload.drivers.find((item) => item._id === trip.driverId) || trip.driver;
        const vehicle = action.payload.vehicles.find((item) => item._id === trip.vehicleId) || trip.vehicle;
        return { ...trip, tripNumber: trip.tripNumber || nextTripNumber(state.allItems.slice(index)), booking, driver, vehicle };
      });
      refresh(state);
    }
  }
});

export const tripActions = tripSlice.actions;
export const { assignTrip, completeTrip, updateTripStatus, setItems: setTrips } = tripSlice.actions;
export default tripSlice.reducer;

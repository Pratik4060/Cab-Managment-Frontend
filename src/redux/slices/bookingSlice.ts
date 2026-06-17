import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { bookingApi, normalizeBooking, type BookingPayload, type DutySlipPayload } from "../../api/bookingApi";
import { applyFilter } from "./createEntitySlice";

type BookingState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  requestMessage: string;
  error: string | null;
  message: string | null;
  filter: Record<string, any>;
  scanResult: any | null;
  bucketItems: {
    New: any[];
    Confirmed: any[];
    CompletedCancelled: any[];
  };
};

const initialState: BookingState = {
  items: [],
  allItems: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  requestMessage: "",
  error: null,
  message: null,
  filter: {},
  scanResult: null,
  bucketItems: {
    New: [],
    Confirmed: [],
    CompletedCancelled: []
  }
};

function refresh(state: BookingState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.page = 1;
  state.pages = 1;
  state.loading = false;
  state.requestMessage = "";
}

function ensureBuckets(state: BookingState) {
  state.bucketItems ||= { New: [], Confirmed: [], CompletedCancelled: [] };
  state.bucketItems.New ||= [];
  state.bucketItems.Confirmed ||= [];
  state.bucketItems.CompletedCancelled ||= [];
}

function upsertBooking(items: any[], booking: any) {
  const normalized = normalizeBooking(booking);
  const id = String(normalized._id);
  const exists = items.some((item) => String(item._id) === id);
  return exists
    ? items.map((item) => String(item._id) === id ? normalized : item)
    : [normalized, ...items];
}

function rejectMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Booking request failed. Please try again.";
}

export const fetchAll = createAsyncThunk("bookings/fetchAll", async (filter: Record<string, any> | undefined, { rejectWithValue }) => {
  try {
    return { filter: filter || {}, items: await bookingApi.getBookings(filter || {}) };
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const fetchBookingBuckets = createAsyncThunk("bookings/fetchBookingBuckets", async (_, { rejectWithValue }) => {
  try {
    const [newItems, assignedItems, completedItems, cancelledItems] = await Promise.all([
      bookingApi.getBookings({ status: "New" }),
      bookingApi.getBookings({ status: "Confirmed" }),
      bookingApi.getBookings({ status: "Completed" }),
      bookingApi.getBookings({ status: "Cancelled" })
    ]);
    return { newItems, assignedItems, completedCancelledItems: [...completedItems, ...cancelledItems] };
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const fetchById = createAsyncThunk("bookings/fetchById", async (id: string, { rejectWithValue }) => {
  try {
    return await bookingApi.getBookingById(id);
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const createOne = createAsyncThunk("bookings/createOne", async (payload: BookingPayload, { rejectWithValue }) => {
  try {
    return await bookingApi.createBooking(payload);
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const updateOne = createAsyncThunk("bookings/updateOne", async ({ id, payload }: { id: string; payload: Partial<BookingPayload> }, { rejectWithValue }) => {
  try {
    return await bookingApi.updateBooking(id, payload);
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const assignBooking = createAsyncThunk("bookings/assignBooking", async ({ id, driverId, vehicleId }: { id: string; driverId: string; vehicleId: string }, { rejectWithValue }) => {
  try {
    return await bookingApi.assignBooking(id, { assigned_driver: driverId, assigned_vehicle: vehicleId });
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const cancelBooking = createAsyncThunk("bookings/cancelBooking", async (id: string, { rejectWithValue }) => {
  try {
    return await bookingApi.cancelBooking(id);
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const scanMails = createAsyncThunk("bookings/scanMails", async (_, { rejectWithValue }) => {
  try {
    return await bookingApi.scanMails();
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

export const createDutySlip = createAsyncThunk("bookings/createDutySlip", async (payload: DutySlipPayload, { rejectWithValue }) => {
  try {
    return await bookingApi.createDutySlip(payload);
  } catch (error) {
    return rejectWithValue(rejectMessage(error));
  }
});

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<any[]>) {
      state.allItems = action.payload.map(normalizeBooking);
      refresh(state);
    },
    deleteOneLocal(state, action: PayloadAction<string>) {
      state.allItems = state.allItems.filter((item) => String(item._id) !== String(action.payload));
      refresh(state);
    },
    changeStatus(state, action: PayloadAction<{ id: string; status: string }>) {
      state.allItems = state.allItems.map((item) => String(item._id) === String(action.payload.id) ? { ...item, status: action.payload.status } : item);
      refresh(state);
    },
    clearBookingMessage(state) {
      state.message = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAll.pending, (state) => {
        state.loading = true;
        state.requestMessage = "Loading Bookings...";
        state.error = null;
      })
      .addCase(fetchAll.fulfilled, (state, action) => {
        ensureBuckets(state);
        state.filter = action.payload.filter;
        state.allItems = action.payload.items;
        if (action.payload.filter.status === "New") {
          state.bucketItems.New = action.payload.items;
        }
        if (action.payload.filter.status === "Confirmed") {
          state.bucketItems.Confirmed = action.payload.items;
        }
        if (["Completed", "Cancelled"].includes(action.payload.filter.status)) {
          state.bucketItems.CompletedCancelled = action.payload.items;
        }
        refresh(state);
      })
      .addCase(fetchBookingBuckets.fulfilled, (state, action) => {
        ensureBuckets(state);
        state.bucketItems.New = action.payload.newItems;
        state.bucketItems.Confirmed = action.payload.assignedItems;
        state.bucketItems.CompletedCancelled = action.payload.completedCancelledItems;
        state.allItems = state.filter.status === "Confirmed" ? action.payload.assignedItems : action.payload.newItems;
        state.filter = { status: state.filter.status === "Confirmed" ? "Confirmed" : "New" };
        refresh(state);
      })
      .addCase(fetchById.fulfilled, (state, action) => {
        state.allItems = upsertBooking(state.allItems, action.payload);
        refresh(state);
      })
      .addCase(createOne.fulfilled, (state, action) => {
        state.allItems = upsertBooking(state.allItems, action.payload);
        state.message = "Booking created successfully.";
        refresh(state);
      })
      .addCase(updateOne.fulfilled, (state, action) => {
        state.allItems = upsertBooking(state.allItems, action.payload);
        state.message = "Booking updated successfully.";
        refresh(state);
      })
      .addCase(assignBooking.fulfilled, (state, action) => {
        state.allItems = upsertBooking(state.allItems, action.payload);
        state.message = "Booking assigned successfully.";
        refresh(state);
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.allItems = upsertBooking(state.allItems, action.payload);
        state.message = "Booking cancelled successfully.";
        refresh(state);
      })
      .addCase(scanMails.fulfilled, (state, action) => {
        state.loading = false;
        state.requestMessage = "";
        state.scanResult = action.payload;
        const insertedCount = Number(action.payload?.insertedCount || 0);
        state.message = insertedCount > 0
          ? `${insertedCount} new booking${insertedCount === 1 ? "" : "s"} found from mail.`
          : "No new bookings found in mail scan.";
      })
      .addCase(createDutySlip.fulfilled, (state) => {
        state.loading = false;
        state.requestMessage = "";
        state.message = "Duty slip generated successfully.";
      })
      .addMatcher((action) => action.type.startsWith("bookings/") && action.type.endsWith("/pending"), (state, action) => {
        state.loading = true;
        state.requestMessage = bookingRequestMessage(action.type);
        state.error = null;
      })
      .addMatcher((action) => action.type.startsWith("bookings/") && action.type.endsWith("/rejected"), (state, action: any) => {
        state.loading = false;
        state.requestMessage = "";
        state.error = String(action.payload || "Booking request failed. Please try again.");
      });
  }
});

export const bookingActions = {
  fetchAll,
  fetchBookingBuckets,
  fetchById,
  createOne,
  updateOne,
  deleteOne: cancelBooking,
  changeStatus: bookingSlice.actions.changeStatus,
  setItems: bookingSlice.actions.setItems,
  assignBooking,
  cancelBooking,
  scanMails,
  createDutySlip,
  clearBookingMessage: bookingSlice.actions.clearBookingMessage
};

export const addBooking = createOne;
export const updateBooking = updateOne;
export const deleteBooking = cancelBooking;
export const changeBookingStatus = bookingSlice.actions.changeStatus;
export const setBookings = bookingSlice.actions.setItems;
export default bookingSlice.reducer;

function bookingRequestMessage(actionType: string) {
  if (actionType === fetchAll.pending.type || actionType === fetchBookingBuckets.pending.type) return "Loading Bookings...";
  if (actionType === scanMails.pending.type) return "Scanning mail...";
  if (actionType === createDutySlip.pending.type) return "Generating duty slip...";
  if (actionType === assignBooking.pending.type) return "Assigning booking...";
  if (actionType === cancelBooking.pending.type) return "Cancelling booking...";
  if (actionType === createOne.pending.type) return "Creating booking...";
  if (actionType === updateOne.pending.type) return "Updating booking...";
  if (actionType === fetchById.pending.type) return "Loading booking details...";
  return "Processing booking request...";
}

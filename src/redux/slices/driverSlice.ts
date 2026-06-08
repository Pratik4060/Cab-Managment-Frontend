import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { driverApi } from "../../api/driverApi";
import { seedDrivers } from "../seedData";

type DriverState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  filter: Record<string, any>;
};

const initialState: DriverState = {
  items: seedDrivers,
  allItems: seedDrivers,
  total: seedDrivers.length,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  filter: {}
};

export const fetchAll = createAsyncThunk("drivers/fetchAll", async (filter: Record<string, any> | undefined, { rejectWithValue }) => {
  try {
    const resolvedFilter = filter || {};
    const rows = await driverApi.getDrivers(resolvedFilter);
    return { rows, filter: resolvedFilter };
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const createOne = createAsyncThunk("drivers/createOne", async (payload: any, { rejectWithValue }) => {
  try {
    return await driverApi.createDriver({ status: "Available", ...payload });
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const updateOne = createAsyncThunk("drivers/updateOne", async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    return await driverApi.updateDriver(id, payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const deleteOne = createAsyncThunk("drivers/deleteOne", async (id: string, { rejectWithValue }) => {
  try {
    return await driverApi.deleteDriver(id);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const changeStatus = createAsyncThunk("drivers/changeStatus", async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
  try {
    return await driverApi.changeDriverStatus(id, status);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

const driverSlice = createSlice({
  name: "drivers",
  initialState,
  reducers: {
      setItems(state, action: PayloadAction<any[]>) {
      state.allItems = sortDrivers(action.payload);
      refresh(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAll.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.filter = action.payload.filter;
        state.allItems = sortDrivers(action.payload.rows);
        refresh(state);
      })
      .addCase(fetchAll.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch drivers.";
        refresh(state);
      })
      .addCase(createOne.pending, setLoading)
      .addCase(createOne.fulfilled, (state, action) => {
        state.allItems = sortDrivers([action.payload, ...state.allItems]);
        refreshSuccess(state);
      })
      .addCase(createOne.rejected, setRejected)
      .addCase(updateOne.pending, setLoading)
      .addCase(updateOne.fulfilled, (state, action) => {
        state.allItems = sortDrivers(state.allItems.map((driver) => driver._id === action.payload._id ? action.payload : driver));
        refreshSuccess(state);
      })
      .addCase(updateOne.rejected, setRejected)
      .addCase(deleteOne.pending, setLoading)
      .addCase(deleteOne.fulfilled, (state, action) => {
        state.allItems = sortDrivers(state.allItems.filter((driver) => driver._id !== action.payload));
        refreshSuccess(state);
      })
      .addCase(deleteOne.rejected, setRejected)
      .addCase(changeStatus.pending, setLoading)
      .addCase(changeStatus.fulfilled, (state, action) => {
        state.allItems = sortDrivers(state.allItems.map((driver) => driver._id === action.payload._id ? action.payload : driver));
        refreshSuccess(state);
      })
      .addCase(changeStatus.rejected, setRejected);
  }
});

function sortDrivers(items: any[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left?.createdAt || left?.updatedAt || 0).getTime();
    const rightTime = new Date(right?.createdAt || right?.updatedAt || 0).getTime();
    if (rightTime !== leftTime) return rightTime - leftTime;

    const leftId = Number(left?._id || left?.id || 0);
    const rightId = Number(right?._id || right?.id || 0);
    if (!Number.isNaN(leftId) && !Number.isNaN(rightId) && rightId !== leftId) {
      return rightId - leftId;
    }

    return String(right?._id || right?.id || "").localeCompare(String(left?._id || left?.id || ""));
  });
}

function applyFilter(items: any[], filter: Record<string, any> = {}) {
  return items.filter((item) => Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null || value === "") return true;
    return String(item[key]) === String(value);
  }));
}

function refresh(state: DriverState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.page = 1;
  state.pages = 1;
  state.loading = false;
}

function refreshSuccess(state: DriverState) {
  state.error = null;
  refresh(state);
}

function setLoading(state: DriverState) {
  state.loading = true;
  state.error = null;
}

function setRejected(state: DriverState, action: PayloadAction<unknown>) {
  state.loading = false;
  state.error = typeof action.payload === "string" ? action.payload : "Driver request failed.";
}

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Driver request failed.";
}

export const driverActions = { fetchAll, createOne, updateOne, deleteOne, changeStatus, setItems: driverSlice.actions.setItems };
export const { setItems: setDrivers } = driverSlice.actions;
export const addDriver = createOne;
export const updateDriver = updateOne;
export const deleteDriver = deleteOne;
export const changeDriverStatus = changeStatus;
export default driverSlice.reducer;

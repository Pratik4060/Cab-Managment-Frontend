import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { vehicleApi } from "../../api/vehicleApi";

type VehicleState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  requestMessage: string;
  error: string | null;
  filter: Record<string, any>;
};

const initialState: VehicleState = {
  items: [],
  allItems: [],
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  requestMessage: "",
  error: null,
  filter: {}
};

export const fetchAll = createAsyncThunk("vehicles/fetchAll", async (filter: Record<string, any> | undefined, { rejectWithValue }) => {
  try {
    return { rows: await vehicleApi.getVehicles(), filter: filter || {} };
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const createOne = createAsyncThunk("vehicles/createOne", async (payload: any, { rejectWithValue }) => {
  try {
    return await vehicleApi.createVehicle({ ...payload, status: payload.status || "Available" });
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const updateOne = createAsyncThunk("vehicles/updateOne", async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    return await vehicleApi.updateVehicle(id, payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const deleteOne = createAsyncThunk("vehicles/deleteOne", async (id: string, { rejectWithValue }) => {
  try {
    return await vehicleApi.deleteVehicle(id);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const changeStatus = createAsyncThunk("vehicles/changeStatus", async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
  try {
    return await vehicleApi.updateVehicle(id, { status });
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

const vehicleSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<any[]>) {
      state.allItems = action.payload;
      refresh(state);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAll.pending, (state) => {
        state.loading = true;
        state.requestMessage = "Loading cars...";
        state.error = null;
      })
      .addCase(fetchAll.fulfilled, (state, action) => {
        state.loading = false;
        state.requestMessage = "";
        state.error = null;
        state.filter = action.payload.filter;
        state.allItems = action.payload.rows;
        refresh(state);
      })
      .addCase(fetchAll.rejected, (state, action) => {
        state.loading = false;
        state.requestMessage = "";
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch cars.";
        refresh(state);
      })
      .addCase(createOne.pending, setLoading)
      .addCase(createOne.fulfilled, (state, action) => {
        state.allItems.unshift(action.payload);
        refreshSuccess(state);
      })
      .addCase(createOne.rejected, setRejected)
      .addCase(updateOne.pending, setLoading)
      .addCase(updateOne.fulfilled, (state, action) => {
        state.allItems = state.allItems.map((vehicle) => vehicle._id === action.payload._id ? action.payload : vehicle);
        refreshSuccess(state);
      })
      .addCase(updateOne.rejected, setRejected)
      .addCase(deleteOne.pending, setLoading)
      .addCase(deleteOne.fulfilled, (state, action) => {
        state.allItems = state.allItems.filter((vehicle) => vehicle._id !== action.payload);
        refreshSuccess(state);
      })
      .addCase(deleteOne.rejected, setRejected)
      .addCase(changeStatus.pending, setLoading)
      .addCase(changeStatus.fulfilled, (state, action) => {
        state.allItems = state.allItems.map((vehicle) => vehicle._id === action.payload._id ? action.payload : vehicle);
        refreshSuccess(state);
      })
      .addCase(changeStatus.rejected, setRejected);
  }
});

function applyFilter(items: any[], filter: Record<string, any> = {}) {
  return items.filter((item) => Object.entries(filter).every(([key, value]) => {
    if (value === undefined || value === null || value === "") return true;
    return String(item[key]) === String(value);
  }));
}

function refresh(state: VehicleState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.page = 1;
  state.pages = 1;
  state.loading = false;
  state.requestMessage = "";
}

function refreshSuccess(state: VehicleState) {
  state.error = null;
  refresh(state);
}

function setLoading(state: VehicleState) {
  state.loading = true;
  state.requestMessage = "Processing car request...";
  state.error = null;
}

function setRejected(state: VehicleState, action: PayloadAction<unknown>) {
  state.loading = false;
  state.requestMessage = "";
  state.error = typeof action.payload === "string" ? action.payload : "Car request failed.";
}

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Car request failed.";
}

export const vehicleActions = { fetchAll, createOne, updateOne, deleteOne, changeStatus, setItems: vehicleSlice.actions.setItems };
export const { setItems: setVehicles } = vehicleSlice.actions;
export const addVehicle = createOne;
export const updateVehicle = updateOne;
export const deleteVehicle = deleteOne;
export const changeVehicleStatus = changeStatus;
export default vehicleSlice.reducer;

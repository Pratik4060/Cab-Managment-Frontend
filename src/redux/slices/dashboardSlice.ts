import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { dashboardApi, type DashboardFilter } from "../../api/dashboardApi";

type DashboardState = {
  data: any;
  loading: boolean;
  error: string | null;
  period: DashboardFilter;
};

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  period: "month"
};

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetchDashboard",
  async (payload: { period?: DashboardFilter; recentLimit?: number } | undefined, { rejectWithValue }) => {
    try {
      const filter = payload?.period || "month";
      return await dashboardApi.getDashboard(filter, payload?.recentLimit || 5);
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : "Failed to fetch dashboard.");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDashboard(state, action: PayloadAction<any>) {
      state.data = action.payload;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.period = action.meta.arg?.period || state.period;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch dashboard.";
      });
  }
});

export const { setDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

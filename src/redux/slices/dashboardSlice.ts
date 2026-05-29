import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { data: null as any, loading: false, error: null as string | null, period: "month" },
  reducers: {
    fetchDashboard(state, action: PayloadAction<{ period?: string } | undefined>) {
      state.period = action.payload?.period || state.period;
      state.loading = false;
      state.error = null;
    },
    setDashboard(state, action: PayloadAction<any>) {
      state.data = action.payload;
    }
  }
});

export const { fetchDashboard, setDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

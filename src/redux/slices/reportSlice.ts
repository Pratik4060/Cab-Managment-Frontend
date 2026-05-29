import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState = { data: null as any, current: null as any, loading: false, error: null as string | null, type: "invoices", params: {} as any };

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    fetchReports(state) {
      state.data = state.data || {};
    },
    fetchReportByType(state, action: PayloadAction<{ type: string; params?: any }>) {
      state.type = action.payload.type;
      state.params = action.payload.params || {};
      state.loading = false;
      state.error = null;
    },
    setCurrentReport(state, action: PayloadAction<any>) {
      state.current = action.payload;
      state.loading = false;
    },
    setReportSummary(state, action: PayloadAction<any>) {
      state.data = action.payload;
    }
  }
});

export const { fetchReports, fetchReportByType, setCurrentReport, setReportSummary } = reportSlice.actions;
export default reportSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export default createSlice({
  name: "analytics",
  initialState: { lastReportType: null as any, chartData: [] as any[] },
  reducers: {
    setAnalytics(state, action: PayloadAction<{ type: string; chartData: any[] }>) {
      state.lastReportType = action.payload.type;
      state.chartData = action.payload.chartData;
    }
  }
}).reducer;

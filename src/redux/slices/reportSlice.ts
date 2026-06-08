import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { reportApi, type ReportFilter } from "../../api/reportApi";

type ReportState = {
  summary: any;
  current: any;
  loading: boolean;
  error: string | null;
  type: string;
  params: ReportFilter;
};

const initialState: ReportState = {
  summary: null,
  current: null,
  loading: false,
  error: null,
  type: "invoices",
  params: { period: "month", search: "", status: "" }
};

export const fetchReports = createAsyncThunk("reports/fetchReports", async (_, { rejectWithValue }) => {
  try {
    return await reportApi.getSummary();
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const fetchReportByType = createAsyncThunk("reports/fetchReportByType", async ({ type, params }: { type: string; params?: ReportFilter }, { rejectWithValue }) => {
  try {
    return { type, report: await reportApi.getReportByType(type, params || {}) };
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setCurrentReport(state, action: PayloadAction<any>) {
      state.current = action.payload;
    },
    setReportSummary(state, action: PayloadAction<any>) {
      state.summary = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch report summary.";
      })
      .addCase(fetchReportByType.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.type = action.meta.arg.type;
        state.params = action.meta.arg.params || { period: "month", search: "", status: "" };
      })
      .addCase(fetchReportByType.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.report;
        state.type = action.payload.type;
        state.error = null;
      })
      .addCase(fetchReportByType.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch report.";
      });
  }
});

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Report request failed.";
}

export const { setCurrentReport, setReportSummary } = reportSlice.actions;
export default reportSlice.reducer;

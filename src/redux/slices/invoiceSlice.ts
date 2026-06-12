import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ApiError } from "../../api/client";
import { invoiceApi, normalizeInvoice } from "../../api/invoiceApi";
import { applyFilter } from "./createEntitySlice";
import { seedInvoices } from "../seedData";

type InvoiceState = {
  items: any[];
  allItems: any[];
  total: number;
  page: number;
  pages: number;
  loading: boolean;
  error: string | null;
  filter: Record<string, any>;
};

const initialState: InvoiceState = {
  items: seedInvoices,
  allItems: seedInvoices,
  total: seedInvoices.length,
  page: 1,
  pages: 1,
  loading: false,
  error: null,
  filter: {}
};

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Invoice request failed.";
}

export const fetchAll = createAsyncThunk("invoices/fetchAll", async (filter: Record<string, any> | undefined, { rejectWithValue }) => {
  try {
    return { filter: filter || {}, items: await invoiceApi.getInvoices(filter || {}) };
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const fetchById = createAsyncThunk("invoices/fetchById", async (id: string, { rejectWithValue }) => {
  try {
    return await invoiceApi.getInvoiceById(id);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const updateOne = createAsyncThunk("invoices/updateOne", async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    return await invoiceApi.updateInvoice(id, payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const updatePaymentStatus = createAsyncThunk("invoices/updatePaymentStatus", async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    return await invoiceApi.updatePaymentStatus(id, payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const sendInvoice = createAsyncThunk("invoices/sendInvoice", async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
  try {
    return await invoiceApi.sendInvoice(id, payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const sendBulkInvoices = createAsyncThunk("invoices/sendBulkInvoices", async (payload: any, { rejectWithValue }) => {
  try {
    return await invoiceApi.sendBulk(payload);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const deleteOne = createAsyncThunk("invoices/deleteOne", async (id: string, { rejectWithValue }) => {
  try {
    return await invoiceApi.deleteInvoice(id);
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const downloadPdf = createAsyncThunk("invoices/downloadPdf", async (id: string, { rejectWithValue }) => {
  try {
    return { id, blob: await invoiceApi.downloadPdf(id) };
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

function refresh(state: InvoiceState) {
  state.items = applyFilter(state.allItems, state.filter);
  state.total = state.items.length;
  state.loading = false;
}

function nextInvoiceNumber(items: any[]) {
  const year = new Date().getFullYear();
  const max = items.reduce((highest, invoice) => {
    const match = String(invoice.invoiceNumber || "").match(/INV-\d{4}-(\d+)/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `INV-${year}-${String(max + 1).padStart(4, "0")}`;
}

function parseDateOnly(value: string | Date | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function listServiceDays(trip: any) {
  const start =
    parseDateOnly(trip.booking?.travelStartDate) ||
    parseDateOnly(trip.timeOut) ||
    parseDateOnly(trip.createdAt) ||
    new Date();
  const end =
    parseDateOnly(trip.booking?.travelEndDate) ||
    parseDateOnly(trip.timeIn) ||
    start;

  const normalizedStart = startOfDay(start);
  const normalizedEnd = startOfDay(end);
  if (normalizedEnd < normalizedStart) return [normalizedStart];

  const days: Date[] = [];
  for (let cursor = new Date(normalizedStart); cursor <= normalizedEnd; cursor = addDays(cursor, 1)) {
    days.push(new Date(cursor));
  }
  return days.length ? days : [normalizedStart];
}

function splitAmount(total: number, parts: number, index: number) {
  const roundedTotal = Math.round(total);
  if (parts <= 1) return roundedTotal;
  const base = Math.floor(roundedTotal / parts);
  const remainder = roundedTotal - base * parts;
  return index === parts - 1 ? base + remainder : base;
}

function invoiceFromTrip(trip: any, items: any[], serviceDate?: Date, index = 0, totalDays = 1) {
  const hasCostCenter = Boolean(String(trip?.booking?.costCenterOfProject ?? "").trim());
  const projectType = normalizeProjectType(
    trip?.projectType ?? (hasCostCenter ? "Management" : "Process"),
  );
  const tripFareTotal = Math.round(Number(trip.totalKm || 40) * Number(trip.vehicle?.rate_per_km || trip.vehicle?.ratePerKm || 22));
  const tollTotal = Number(trip.tollCharges || 0);
  const parkingTotal = Number(trip.parkingCharges || 0);
  const extraTotal = Number(trip.extraCharges || 0);
  const tripFare = splitAmount(tripFareTotal, totalDays, index);
  const subtotal = tripFare + splitAmount(tollTotal, totalDays, index) + splitAmount(parkingTotal, totalDays, index) + splitAmount(extraTotal, totalDays, index);
  const gstPercent = Number(trip.gstCharges ?? trip.gstPercent ?? 5);
  const gstAmount = Math.round(subtotal * (gstPercent / 100));
  const finalAmount = subtotal + gstAmount;
  return {
    _id: `inv-${Date.now()}-${index + 1}`,
    invoiceNumber: nextInvoiceNumber(items),
    tripId: trip._id,
    bookingId: trip.bookingId,
    invoiceDate: serviceDate ? serviceDate.toISOString() : new Date().toISOString(),
    trip,
    booking: trip.booking,
    clientName: trip.booking?.businessUnit || "Client",
    clientEmail: trip.booking?.senderEmail || "",
    projectType,
    billingAddress:
      trip.billingAddress ||
      trip.booking?.reportingAddress ||
      trip.booking?.dropAddress ||
      "",
    tripFare,
    subtotal,
    gstPercent,
    gstAmount,
    finalAmount,
    paidAmount: 0,
    remainingAmount: finalAmount,
    balanceAmount: finalAmount,
    status: "Draft",
    createdAt: new Date().toISOString()
  };
}

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<any[]>) {
      state.allItems = action.payload.map(normalizeInvoice);
      refresh(state);
    },
    createOne(state, action: PayloadAction<any>) {
      state.allItems.unshift({ _id: `inv-${Date.now()}`, createdAt: new Date().toISOString(), ...action.payload });
      refresh(state);
    },
    updateOneLocal(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.allItems = state.allItems.map((invoice) => invoice._id === action.payload.id ? { ...invoice, ...action.payload.payload, updatedAt: new Date().toISOString() } : invoice);
      refresh(state);
    },
    generateInvoice(state, action: PayloadAction<any>) {
      const trip = action.payload;
    const tripId = trip?._id || trip;
      const existing = state.allItems.find((invoice) => invoice.tripId === tripId);
      if (existing) return;
      const serviceDays = listServiceDays(trip);
      const created: any[] = [];
      const invoices = serviceDays.map((serviceDate, index) => {
        const invoice = invoiceFromTrip(trip, [...state.allItems, ...created], serviceDate, index, serviceDays.length);
        created.push(invoice);
        return invoice;
      });
      state.allItems.unshift(...invoices.reverse());
      refresh(state);
    },
    regenerateInvoice(state, action: PayloadAction<string>) {
      state.allItems = state.allItems.map((invoice) => invoice._id === action.payload ? { ...invoice, updatedAt: new Date().toISOString() } : invoice);
      refresh(state);
    },
    sendInvoiceLocal(state, action: PayloadAction<{ id: string; payload?: any }>) {
      state.allItems = state.allItems.map((invoice) => (
        invoice._id === action.payload.id
          ? {
              ...invoice,
              clientEmail: action.payload.payload?.clientEmail || invoice.clientEmail,
              status: Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0) > 0 ? "Sent" : "Paid",
              sentAt: new Date().toISOString()
            }
          : invoice
      ));
      refresh(state);
    },
    applyPayment(state, action: PayloadAction<{ invoiceId: string; amount: number }>) {
      state.allItems = state.allItems.map((invoice) => {
        if (invoice._id !== action.payload.invoiceId) return invoice;
        const paidAmount = Math.min(Number(invoice.finalAmount || 0), Number(invoice.paidAmount || 0) + Number(action.payload.amount || 0));
        const remainingAmount = Math.max(0, Number(invoice.finalAmount || 0) - paidAmount);
        return {
          ...invoice,
          paidAmount,
          remainingAmount,
          balanceAmount: remainingAmount,
          status: remainingAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : invoice.status,
          updatedAt: new Date().toISOString()
        };
      });
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
        state.filter = action.payload.filter;
        state.allItems = action.payload.items;
        refresh(state);
      })
      .addCase(fetchAll.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Failed to fetch invoices.";
      })
      .addMatcher((action) => action.type.startsWith("invoices/") && action.type.endsWith("/pending") && action.type !== fetchAll.pending.type, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher((action) => action.type.startsWith("invoices/") && action.type.endsWith("/fulfilled") && action.type !== fetchAll.fulfilled.type, (state, action: any) => {
        state.loading = false;
        if (action.type === deleteOne.fulfilled.type) {
          state.allItems = state.allItems.filter((invoice) => String(invoice._id) !== String(action.payload));
          refresh(state);
          return;
        }
        if (action.type === downloadPdf.fulfilled.type || action.type === sendBulkInvoices.fulfilled.type) return;
        if (action.payload && typeof action.payload === "object") {
          const updated = normalizeInvoice(action.payload);
          state.allItems = state.allItems.some((invoice) => String(invoice._id) === String(updated._id))
            ? state.allItems.map((invoice) => String(invoice._id) === String(updated._id) ? updated : invoice)
            : [updated, ...state.allItems];
          refresh(state);
        }
      })
      .addMatcher((action) => action.type.startsWith("invoices/") && action.type.endsWith("/rejected"), (state, action: any) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Invoice request failed.";
      });
  }
});

export const invoiceActions = {
  ...invoiceSlice.actions,
  fetchAll,
  fetchById,
  updateOne,
  updatePaymentStatus,
  sendInvoice,
  sendBulkInvoices,
  deleteOne,
  downloadPdf
};
export const { generateInvoice, regenerateInvoice, applyPayment, setItems: setInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;

function normalizeProjectType(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase() === "management"
    ? "Management"
    : "Process";
}

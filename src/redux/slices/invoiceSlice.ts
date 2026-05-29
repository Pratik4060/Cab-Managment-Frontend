import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
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

function invoiceFromTrip(trip: any, items: any[]) {
  const subtotal = Math.round(Number(trip.totalKm || 40) * Number(trip.vehicle?.ratePerKm || 22) + Number(trip.tollCharges || 0) + Number(trip.parkingCharges || 0) + Number(trip.extraCharges || 0));
  const gstAmount = Math.round(subtotal * 0.05);
  const finalAmount = subtotal + gstAmount;
  return {
    _id: `inv-${Date.now()}`,
    invoiceNumber: nextInvoiceNumber(items),
    tripId: trip._id,
    bookingId: trip.bookingId,
    trip,
    booking: trip.booking,
    clientName: trip.booking?.businessUnit || "Client",
    clientEmail: trip.booking?.senderEmail || "",
    subtotal,
    gstPercent: 5,
    gstAmount,
    finalAmount,
    paidAmount: 0,
    balanceAmount: finalAmount,
    status: "Draft",
    createdAt: new Date().toISOString()
  };
}

const invoiceSlice = createSlice({
  name: "invoices",
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
    createOne(state, action: PayloadAction<any>) {
      state.allItems.unshift({ _id: `inv-${Date.now()}`, createdAt: new Date().toISOString(), ...action.payload });
      refresh(state);
    },
    updateOne(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.allItems = state.allItems.map((invoice) => invoice._id === action.payload.id ? { ...invoice, ...action.payload.payload, updatedAt: new Date().toISOString() } : invoice);
      refresh(state);
    },
    deleteOne(state, action: PayloadAction<string>) {
      state.allItems = state.allItems.filter((invoice) => invoice._id !== action.payload);
      refresh(state);
    },
    generateInvoice(state, action: PayloadAction<any>) {
      const trip = action.payload;
      const existing = state.allItems.find((invoice) => invoice.tripId === (trip._id || trip));
      if (existing) return;
      state.allItems.unshift(invoiceFromTrip(trip, state.allItems));
      refresh(state);
    },
    regenerateInvoice(state, action: PayloadAction<string>) {
      state.allItems = state.allItems.map((invoice) => invoice._id === action.payload ? { ...invoice, updatedAt: new Date().toISOString() } : invoice);
      refresh(state);
    },
    sendInvoice(state, action: PayloadAction<{ id: string; payload?: any }>) {
      state.allItems = state.allItems.map((invoice) => (
        invoice._id === action.payload.id
          ? { ...invoice, clientEmail: action.payload.payload?.clientEmail || invoice.clientEmail, status: invoice.balanceAmount > 0 ? "Sent" : "Paid", sentAt: new Date().toISOString() }
          : invoice
      ));
      refresh(state);
    },
    applyPayment(state, action: PayloadAction<{ invoiceId: string; amount: number }>) {
      state.allItems = state.allItems.map((invoice) => {
        if (invoice._id !== action.payload.invoiceId) return invoice;
        const paidAmount = Math.min(Number(invoice.finalAmount || 0), Number(invoice.paidAmount || 0) + Number(action.payload.amount || 0));
        const balanceAmount = Math.max(0, Number(invoice.finalAmount || 0) - paidAmount);
        return {
          ...invoice,
          paidAmount,
          balanceAmount,
          status: balanceAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : invoice.status,
          updatedAt: new Date().toISOString()
        };
      });
      refresh(state);
    }
  }
});

export const invoiceActions = invoiceSlice.actions;
export const { generateInvoice, regenerateInvoice, sendInvoice, applyPayment, setItems: setInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const paymentSlice = createSlice({
  name: "payments",
  initialState: { items: [] as any[], loading: false, error: null as string | null },
  reducers: {
    setPayments(state, action: PayloadAction<any[]>) {
      state.items = action.payload;
    },
    addPayment: {
      reducer(state, action: PayloadAction<any>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: any) {
        return {
          payload: {
            _id: `pay-${Date.now()}`,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            ...payload
          }
        };
      }
    },
    updatePayment(state, action: PayloadAction<{ id: string; payload: any }>) {
      state.items = state.items.map((payment) => payment._id === action.payload.id ? { ...payment, ...action.payload.payload } : payment);
    },
    deletePayment(state, action: PayloadAction<string>) {
      state.items = state.items.filter((payment) => payment._id !== action.payload);
    }
  }
});

export const { addPayment, updatePayment, deletePayment, setPayments } = paymentSlice.actions;
export default paymentSlice.reducer;

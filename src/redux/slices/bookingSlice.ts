import { createEntitySlice } from "./createEntitySlice";
import { seedBookings } from "../seedData";

const nextBookingId = (items: any[]) => `BKG-2026-${String(items.length + 1).padStart(4, "0")}`;
const slice = createEntitySlice("bookings", {
  seed: seedBookings,
  createDefaults: (payload, items) => ({ bookingId: payload.bookingId || nextBookingId(items), status: payload.status || "New" })
});
export const bookingActions = slice.actions;
export const { createOne: addBooking, updateOne: updateBooking, deleteOne: deleteBooking, changeStatus: changeBookingStatus, setItems: setBookings } = slice.actions;
export default slice.reducer;

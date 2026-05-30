import { createEntitySlice } from "./createEntitySlice";
import { seedAdmins } from "../seedData";

const slice = createEntitySlice("admins", {
  seed: seedAdmins,
  createDefaults: () => ({ isActive: true })
});
export const adminActions = slice.actions;
export const { createOne: addAdmin, updateOne: updateAdmin, deleteOne: deleteAdmin, setItems: setAdmins } = slice.actions;
export default slice.reducer;

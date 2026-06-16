import { createEntitySlice } from "./createEntitySlice";

const slice = createEntitySlice("admins", {
  seed: [],
  createDefaults: () => ({ isActive: true })
});
export const adminActions = slice.actions;
export const { createOne: addAdmin, updateOne: updateAdmin, deleteOne: deleteAdmin, setItems: setAdmins } = slice.actions;
export default slice.reducer;

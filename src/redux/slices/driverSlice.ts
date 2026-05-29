import { createEntitySlice } from "./createEntitySlice";
import { seedDrivers } from "../seedData";

const slice = createEntitySlice("drivers", { seed: seedDrivers });
export const driverActions = slice.actions;
export const { createOne: addDriver, updateOne: updateDriver, deleteOne: deleteDriver, changeStatus: changeDriverStatus, setItems: setDrivers } = slice.actions;
export default slice.reducer;

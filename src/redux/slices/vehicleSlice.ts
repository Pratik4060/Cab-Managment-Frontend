import { createEntitySlice } from "./createEntitySlice";
import { seedVehicles } from "../seedData";

const slice = createEntitySlice("vehicles", { seed: seedVehicles });
export const vehicleActions = slice.actions;
export const { createOne: addVehicle, updateOne: updateVehicle, deleteOne: deleteVehicle, changeStatus: changeVehicleStatus, setItems: setVehicles } = slice.actions;
export default slice.reducer;

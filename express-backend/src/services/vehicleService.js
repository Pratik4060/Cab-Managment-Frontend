import { createEntityService } from "./entityService.js";

const allowedFields = [
  "registrationNumber",
  "vehicleType",
  "vehicleModel",
  "cabType",
  "seatingCapacity",
  "ratePerKm",
  "status"
];

export const vehicleService = createEntityService("vehicles", allowedFields, {
  status: "Available",
  cabType: "Sedan"
});

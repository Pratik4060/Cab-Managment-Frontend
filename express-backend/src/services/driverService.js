import { createEntityService } from "./entityService.js";

const allowedFields = [
  "driverName",
  "contactNumber",
  "alternateContact",
  "aadhaarNumber",
  "panNumber",
  "licenseNumber",
  "aadhaarCardPhoto",
  "panCardPhoto",
  "licensePhoto",
  "address",
  "status"
];

export const driverService = createEntityService("drivers", allowedFields, { status: "Available" });

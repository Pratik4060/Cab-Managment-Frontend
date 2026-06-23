import { z } from "zod";
import { driverActions } from "../redux/slices/driverSlice";
import { vehicleActions } from "../redux/slices/vehicleSlice";
import { EntityPage } from "./EntityPage";

const vehicleModelsByCompany = {
  Toyota: ["Etios", "Innova", "Fortuner", "Glanza", "Rumion"],
  "Maruti Suzuki": ["Dzire", "Ertiga", "Swift", "Brezza", "Ciaz"],
  Honda: ["City", "Amaze", "Elevate", "WR-V"],
  Hyundai: ["Aura", "Verna", "Creta", "Venue", "i20"],
  Tata: ["Nexon", "Tigor", "Altroz", "Punch", "Harrier"],
  Mahindra: ["XUV500", "XUV700", "Scorpio", "Bolero", "Marazzo"],  
  Kia: ["Carens", "Seltos", "Sonet"]
};
const cabTypes = ["Hatchback", "Sedan", "SUV", "MUV/MPV"];
// const vehicleStatuses = ["Available", "Booked", "Maintenance", "Inactive"];

export function CarsPage() {
  return <EntityPage title="Cars" subtitle="Vehicle inventory, rates, compliance, and availability." stateKey="vehicles" actions={vehicleActions} columns={[
    { key: "registration_number", header: "Registration" }, { key: "vehicle_type", header: "Company" }, { key: "vehicle_model", header: "Model" }, { key: "cab_type", header: "Cab Type" }, { key: "seating_capacity", header: "Seats" }, { key: "rate_per_km", header: "Rate/KM" }
  ]} fields={[
    { name: "registration_number", label: "Vehicle Number", required: true },
    { name: "vehicle_type", label: "Vehicle Company", type: "select", options: Object.keys(vehicleModelsByCompany), required: true },
    { name: "vehicle_model", label: "Vehicle Model", type: "select", dependsOn: "vehicle_type", optionsBy: vehicleModelsByCompany, placeholder: "Select company first", required: true },
    { name: "cab_type", label: "Cab Type", type: "select", options: cabTypes, required: true },
    { name: "seating_capacity", label: "Seating Capacity", type: "number", min: 0, required: true },
    { name: "rate_per_km", label: "Rate Per KM", type: "number", required: true },
    // { name: "status", label: "Status", type: "select", options: vehicleStatuses, required: false },
    { name: "insurance_policy_number", label: "Insurance Policy Number", required: false },
    { name: "insurance_expiry", label: "Insurance Expiry", type: "date", required: false },
    { name: "registration_date", label: "Registration Date", type: "date", required: false }
  ]} schema={z.object({
    registration_number: vehicleNumberSchema(),
    vehicle_type: z.string().min(1, "Vehicle company is required."),
    vehicle_model: z.string().min(1, "Vehicle model is required."),
    cab_type: z.string().min(1, "Cab type is required."),
    seating_capacity: z.coerce.number({ invalid_type_error: "Seating capacity must be a number." }).min(0, "Seating capacity cannot be negative."),
    rate_per_km: z.coerce.number({invalid_type_error: "Rate per KM must be a number."}).gt(0, "Rate Per KM must be greater than 0."),
    insurance_policy_number: z.string().optional(),
    insurance_expiry: z.string().optional(),
    registration_date: z.string().optional()
  })} defaults={{ status: "Available" }} statusOptions={cabTypes} filterKey="cab_type" filterLabel="Cab Type" hiddenViewKeys={["cabCategory", "insurancePolicyNumber"]} />;
}

export function DriversPage() {
  return <EntityPage title="Drivers" subtitle="Availability, documents, contacts, and trip history readiness." stateKey="drivers" actions={driverActions} columns={[
    { key: "driverName", header: "Driver" }, { key: "contactNumber", header: "Contact" }, { key: "licenseNumber", header: "License" }, { key: "aadhaarNumber", header: "Aadhaar" }
  ]} fields={[
    { name: "driverName", label: "Driver Name", required: true },
    { name: "contactNumber", label: "Contact Number", required: true },
    { name: "alternateContact", label: "Alternate Contact", required: false },
    { name: "aadhaarNumber", label: "Aadhaar Card Number" },
    { name: "panNumber", label: "PAN Card Number" , required: true},
    { name: "licenseNumber", label: "License Number (e.g: MH1220110012345)", required: true },
    { name: "aadhaarCardPhoto", label: "Aadhaar Card Photo", type: "file", accept: "image/*", required: false },
    { name: "panCardPhoto", label: "PAN Card Photo", type: "file", accept: "image/*", required: false },
    { name: "licensePhoto", label: "License Photo", type: "file", accept: "image/*", required: false, full: true },
    { name: "address", label: "Address", required: true, full: true }
  ]} schema={(isEditing: boolean) => z.object({
    driverName: z.string().min(1, "Driver name is required."),
    contactNumber: mobileNumberSchema("Contact number"),
    alternateContact: optionalMobileNumberSchema("Alternate contact"),
    aadhaarNumber: z.string().min(1, "Aadhaar Card Number is required."),
    panNumber: z.string().min(1, "PAN Card Number is required."),
    licenseNumber: z.string().min(1, "License number is required."),
    aadhaarCardPhoto: isEditing ? z.any().optional() : requiredUpload("Aadhaar card photo"),
    panCardPhoto: isEditing ? z.any().optional() : requiredUpload("PAN card photo"),
    licensePhoto: isEditing ? z.any().optional() : requiredUpload("License photo"),
    address: z.string().min(1, "Address is required.")
  })} hiddenViewKeys={["status"]} searchable searchPlaceholder="Search drivers" />;
}

function vehicleNumberSchema() {
  return z.string()
    .trim()
    .min(1, "Vehicle number is required.")
    .regex(/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, "Vehicle number must be like MH12HQ4959.");
}

function mobileNumberSchema(label: string) {
  return z.string()
    .trim()
    .min(1, `${label} is required.`)
    .regex(/^\d{10}$/, `${label} must be 10 digits.`);
}

function optionalMobileNumberSchema(label: string) {
  return z.preprocess(
    (value) => value === null || value === undefined ? "" : value,
    z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), `${label} must be 10 digits.`),
  );
}

function requiredUpload(label: string) {
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

  return z.any()
    .refine((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      return Boolean(value?.[0]);
    }, `${label} is required`)
    .refine((value) => {
      if (typeof value === "string" || !value?.[0]) return true;

      return value[0].size <= MAX_FILE_SIZE;
    }, `${label} size must not exceed 2 MB.`);
}


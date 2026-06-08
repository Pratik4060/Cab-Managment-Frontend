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

export function CarsPage() {
  return <EntityPage title="Cars" subtitle="Vehicle inventory, rates, compliance, and availability." stateKey="vehicles" actions={vehicleActions} columns={[
    { key: "registrationNumber", header: "Registration" }, { key: "vehicleType", header: "Company" }, { key: "vehicleModel", header: "Model" }, { key: "cabType", header: "Cab Type" }, { key: "seatingCapacity", header: "Seats" }, { key: "ratePerKm", header: "Rate/KM" }
  ]} fields={[
    { name: "registrationNumber", label: "Vehicle Number", required: true },
    { name: "vehicleType", label: "Vehicle Company", type: "select", options: Object.keys(vehicleModelsByCompany), required: true },
    { name: "vehicleModel", label: "Vehicle Model", type: "select", dependsOn: "vehicleType", optionsBy: vehicleModelsByCompany, placeholder: "Select company first", required: true },
    { name: "cabType", label: "Cab Type", type: "select", options: cabTypes, required: true },
    { name: "seatingCapacity", label: "Seating Capacity", type: "number", min: 1, required: true },
    { name: "ratePerKm", label: "Rate Per KM", type: "number", required: true }
  ]} statusOptions={cabTypes} filterKey="cabType" filterLabel="Cab Type" hiddenViewKeys={["status", "cabCategory", "insurancePolicyNumber"]} />;
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
    { name: "licenseNumber", label: "License Number", required: true },
    { name: "aadhaarCardPhoto", label: "Aadhaar Card Photo", type: "file", accept: "image/*", required: false },
    { name: "panCardPhoto", label: "PAN Card Photo", type: "file", accept: "image/*", required: false },
    { name: "licensePhoto", label: "License Photo", type: "file", accept: "image/*", required: false, full: true },
    { name: "address", label: "Address", required: true, full: true }
  ]} schema={(isEditing: boolean) => z.object({
    driverName: z.string().min(1, "Required"),
    contactNumber: z.string().min(1, "Required"),
    alternateContact: z.string().optional(),
    aadhaarNumber: z.string().min(1, "Required"),
    panNumber: z.string().min(1, "Required"),
    licenseNumber: z.string().min(1, "Required"),
    aadhaarCardPhoto: isEditing ? z.any().optional() : requiredUpload("Aadhaar card photo"),
    panCardPhoto: isEditing ? z.any().optional() : requiredUpload("PAN card photo"),
    licensePhoto: isEditing ? z.any().optional() : requiredUpload("License photo"),
    address: z.string().min(1, "Required")
  })} hiddenViewKeys={["status"]} searchable searchPlaceholder="Search drivers" />;
}

function requiredUpload(label: string) {
  return z.any().refine((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return Boolean(value?.[0]);
  }, `${label} is required`);
}


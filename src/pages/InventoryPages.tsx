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
    { name: "seating_capacity", label: "Seating Capacity", type: "number", min: 1, required: true },
    { name: "rate_per_km", label: "Rate Per KM", type: "number", required: true },
    // { name: "status", label: "Status", type: "select", options: vehicleStatuses, required: false },
    { name: "insurance_policy_number", label: "Insurance Policy Number", required: false },
    { name: "insurance_expiry", label: "Insurance Expiry", type: "date", required: false },
    { name: "registration_date", label: "Registration Date", type: "date", required: false }
  ]} defaults={{ status: "Available" }} statusOptions={cabTypes} filterKey="cab_type" filterLabel="Cab Type" hiddenViewKeys={["cabCategory", "insurancePolicyNumber"]} />;
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
  ]} hiddenViewKeys={["status"]} searchable searchPlaceholder="Search drivers" />;
}


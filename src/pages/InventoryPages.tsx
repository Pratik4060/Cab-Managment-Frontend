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

export function CarsPage() {
  return <EntityPage title="Cars" subtitle="Vehicle inventory, rates, compliance, and availability." stateKey="vehicles" actions={vehicleActions} columns={[
    { key: "registrationNumber", header: "Registration" }, { key: "vehicleType", header: "Company" }, { key: "vehicleModel", header: "Model" }, { key: "seatingCapacity", header: "Seats" }, { key: "ratePerKm", header: "Rate/KM" }, { key: "status", header: "Status" }
  ]} fields={[
    { name: "registrationNumber", label: "Vehicle Number", required: true },
    { name: "vehicleType", label: "Vehicle Company", type: "select", options: Object.keys(vehicleModelsByCompany), required: true },
    { name: "vehicleModel", label: "Vehicle Model", type: "select", dependsOn: "vehicleType", optionsBy: vehicleModelsByCompany, placeholder: "Select company first", required: true },
    { name: "seatingCapacity", label: "Seating Capacity", type: "number", min: 1, required: true },
    { name: "ratePerKm", label: "Rate Per KM", type: "number", required: true }
  ]} statusOptions={["Available", "In Trip", "Maintenance"]} />;
}

export function DriversPage() {
  return <EntityPage title="Drivers" subtitle="Availability, documents, contacts, and trip history readiness." stateKey="drivers" actions={driverActions} columns={[
    { key: "driverName", header: "Driver" }, { key: "contactNumber", header: "Contact" }, { key: "licenseNumber", header: "License" }, { key: "aadhaarNumber", header: "Aadhaar" }, { key: "status", header: "Status" }
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
  ]} statusOptions={["Available", "In Trip", "Unavailable"]} />;
}


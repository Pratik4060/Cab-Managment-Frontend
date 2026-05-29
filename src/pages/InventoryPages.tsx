import { driverActions } from "../redux/slices/driverSlice";
import { vehicleActions } from "../redux/slices/vehicleSlice";
import { EntityPage } from "./EntityPage";

export function CarsPage() {
  return <EntityPage title="Cars" subtitle="Vehicle inventory, rates, compliance, and availability." stateKey="vehicles" actions={vehicleActions} columns={[
    { key: "registrationNumber", header: "Registration" }, { key: "vehicleModel", header: "Model" }, { key: "cabCategory", header: "Category" }, { key: "seatingCapacity", header: "Seats" }, { key: "ratePerKm", header: "Rate/KM" }, { key: "status", header: "Status" }
  ]} fields={[
    { name: "registrationNumber", label: "Registration Number" }, { name: "vehicleType", label: "Vehicle Type" }, { name: "vehicleModel", label: "Vehicle Model" }, { name: "cabCategory", label: "Cab Category" }, { name: "seatingCapacity", label: "Seating Capacity", type: "number", min: 1 }, { name: "ratePerKm", label: "Rate Per KM", type: "number" }, { name: "insurancePolicyNumber", label: "Insurance Policy Number", required: false }, { name: "status", label: "Status", type: "select", options: ["Available", "In Trip", "Maintenance"] }
  ]} statusOptions={["Available", "In Trip", "Maintenance"]} />;
}

export function DriversPage() {
  return <EntityPage title="Drivers" subtitle="Availability, documents, contacts, and trip history readiness." stateKey="drivers" actions={driverActions} columns={[
    { key: "driverName", header: "Driver" }, { key: "contactNumber", header: "Contact" }, { key: "licenseNumber", header: "License" }, { key: "status", header: "Status" }
  ]} fields={[
    { name: "driverName", label: "Driver Name" }, { name: "contactNumber", label: "Contact Number" }, { name: "alternateContact", label: "Alternate Contact", required: false }, { name: "licenseNumber", label: "License Number" }, { name: "address", label: "Address", required: false, full: true }, { name: "status", label: "Status", type: "select", options: ["Available", "In Trip", "Unavailable"] }
  ]} statusOptions={["Available", "In Trip", "Unavailable"]} />;
}


import { bookingActions } from "../redux/slices/bookingSlice";
import { EntityPage } from "./EntityPage";

export function InquiriesPage() {
  return <EntityPage title="Inquiries" subtitle="Email-parsed and manually created booking requests." stateKey="bookings" actions={bookingActions} columns={[
    { key: "bookingId", header: "Booking ID" }, { key: "passengerName", header: "Passenger" }, { key: "mobileNumber", header: "Mobile" }, { key: "carType", header: "Car Type" }, { key: "status", header: "Status" }
  ]} fields={[
    { name: "bookingId", label: "Booking ID", required: false, placeholder: "Auto generated", disabled: true }, { name: "businessUnit", label: "Business Unit", required: false }, { name: "passengerName", label: "Passenger Name" }, { name: "mobileNumber", label: "Mobile Number", required: false }, { name: "reportingAddress", label: "Reporting Address", full: true, required: false }, { name: "dropAddress", label: "Drop Address", full: true, required: false }, { name: "carType", label: "Car Type", required: false }, { name: "cabRequestNumber", label: "Cab Request No", required: false }, { name: "status", label: "Status", type: "select", options: ["New", "Pending Assignment", "Cancelled"] }
  ]} statusOptions={["New", "Pending Assignment", "Assigned", "Cancelled"]} canEditRow={(row) => row.status !== "Assigned"} lockedLabel="Converted" />;
}


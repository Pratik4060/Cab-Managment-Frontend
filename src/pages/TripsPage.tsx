import { Eye, FileText, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { bookingActions } from "../redux/slices/bookingSlice";
import { driverActions } from "../redux/slices/driverSlice";
import { generateInvoice } from "../redux/slices/invoiceSlice";
import { vehicleActions } from "../redux/slices/vehicleSlice";
import { assignTrip, tripActions, updateTripStatus } from "../redux/slices/tripSlice";

export function TripsPage() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [viewTrip, setViewTrip] = useState<any>(null);
  const [cancelValues, setCancelValues] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const trips = useAppSelector((s) => s.trips);
  const bookings = useAppSelector((s) => s.bookings.items);
  const drivers = useAppSelector((s) => s.drivers.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    dispatch(tripActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
    dispatch(bookingActions.fetchAll(undefined));
    dispatch(driverActions.fetchAll(undefined));
    dispatch(vehicleActions.fetchAll(undefined));
  }, [dispatch, statusFilter]);

  const availableBookings = bookings.filter((booking) => ["New", "Pending Assignment"].includes(booking.status));
  const availableDrivers = drivers.filter((driver) => driver.status === "Available");
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");

  const fields = [
    {
      name: "bookingId",
      label: "Booking",
      type: "select",
      placeholder: "Select passenger / cab request",
      options: availableBookings.map((booking) => ({ value: booking._id, label: `${booking.passengerName || "Unnamed passenger"} - ${booking.cabRequestNumber || booking.bookingId}` }))
    },
    {
      name: "driverId",
      label: "Driver",
      type: "select",
      placeholder: "Select available driver",
      options: availableDrivers.map((driver) => ({ value: driver._id, label: `${driver.driverName} - ${driver.contactNumber}` }))
    },
    {
      name: "vehicleId",
      label: "Vehicle",
      type: "select",
      placeholder: "Select available vehicle",
      options: availableVehicles.map((vehicle) => ({ value: vehicle._id, label: `${vehicle.registrationNumber} - ${vehicle.vehicleModel} (${vehicle.cabCategory})` }))
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Trips</h1><p className="text-sm text-slate-500">Assign, complete billing data, and generate invoices.</p></div>
        <div className="flex gap-2">
          <select className="input w-44" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="Assigned">Assigned</option>
            <option value="In Trip">In Trip</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Assign Trip</button>
        </div>
      </div>
      <div className="panel p-4">
        <DataTable
          loading={trips.loading}
          rows={trips.items}
          columns={[
            { key: "tripNumber", header: "Trip" },
            { key: "booking", header: "Passenger", render: (r) => r.booking?.passengerName },
            { key: "driver", header: "Driver", render: (r) => r.driver?.driverName },
            { key: "vehicle", header: "Vehicle", render: (r) => r.vehicle?.registrationNumber },
            { key: "status", header: "Status", render: (r) => <TripStatusBadge status={r.status} /> },
            { key: "totalKm", header: "KM" }
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <button className="btn-secondary p-2" title="View trip" onClick={() => setViewTrip(row)}><Eye className="h-4 w-4" /></button>
              <button className="btn-secondary" title="Edit trip status / billing data" disabled={row.status === "Cancelled"} onClick={() => { setActiveTrip(row); setCompleteOpen(true); }}><Pencil className="h-4 w-4" />Edit</button>
              <button className="btn-secondary p-2" title="Generate invoice" disabled={row.status !== "Completed"} onClick={async () => { await dispatch(generateInvoice(row)); }}><FileText className="h-4 w-4" /></button>
            </div>
          )}
        />
      </div>
      <Modal open={open} title="Assign Trip" onClose={() => setOpen(false)}>
        {(!availableBookings.length || !availableDrivers.length || !availableVehicles.length) && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {!availableBookings.length && <p>No unassigned inquiries are available.</p>}
            {!availableDrivers.length && <p>No available drivers are available.</p>}
            {!availableVehicles.length && <p>No available vehicles are available.</p>}
          </div>
        )}
        <EntityForm fields={fields} schema={z.object({ bookingId: z.string().min(1), driverId: z.string().min(1), vehicleId: z.string().min(1) })} onSubmit={async (values) => { await dispatch(assignTrip(values)); await dispatch(tripActions.fetchAll(undefined)); setOpen(false); }} />
      </Modal>
      <Modal open={completeOpen} title="Edit Trip Status / Billing Data" onClose={() => { setCompleteOpen(false); setActiveTrip(null); }}>
        <EntityForm
          fields={[
            { name: "status", label: "Trip Status", type: "select", options: ["Assigned", "In Trip", "Completed", "Cancelled"], full: true },
            { name: "kmOut", label: "KM OUT", type: "number" },
            { name: "kmIn", label: "KM IN", type: "number" },
            { name: "timeOut", label: "Time OUT", type: "datetime-local" },
            { name: "timeIn", label: "Time IN", type: "datetime-local" },
            { name: "tollCharges", label: "Toll Charges", type: "number" },
            { name: "parkingCharges", label: "Parking Charges", type: "number" },
            { name: "extraCharges", label: "Extra Charges", type: "number" },
            { name: "userClosingKm", label: "User Closing KM", type: "number" }
          ]}
          defaults={tripDefaults(activeTrip)}
          schema={tripStatusSchema}
          submitLabel="Save"
          onSubmit={async (values) => {
            if (values.status === "Cancelled") {
              setCancelValues(values);
              return;
            }
            await dispatch(updateTripStatus({ id: activeTrip._id, payload: values }));
            await dispatch(tripActions.fetchAll(undefined));
            setCompleteOpen(false);
            setActiveTrip(null);
          }}
        />
      </Modal>
      <Modal open={Boolean(cancelValues)} title="Confirm Trip Cancellation" onClose={() => setCancelValues(null)}>
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            Are you sure you want to cancel this trip? This will mark the trip and booking as cancelled and release the assigned driver and vehicle.
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setCancelValues(null)}>No</button>
            <button
              className="btn-primary bg-red-600 hover:bg-red-700"
              onClick={async () => {
                await dispatch(updateTripStatus({ id: activeTrip._id, payload: cancelValues }));
                await dispatch(tripActions.fetchAll(undefined));
                setCancelValues(null);
                setCompleteOpen(false);
                setActiveTrip(null);
              }}
            >
              Yes, Cancel Trip
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={Boolean(viewTrip)} title={`View Trip ${viewTrip?.tripNumber || ""}`} onClose={() => setViewTrip(null)}>
        {viewTrip && <TripDetails trip={viewTrip} />}
      </Modal>
    </div>
  );
}

function TripDetails({ trip }: { trip: any }) {
  const rows = [
    ["Trip", trip.tripNumber],
    ["Status", trip.status],
    ["Passenger", trip.booking?.passengerName],
    ["Driver", trip.driver?.driverName],
    ["Vehicle", trip.vehicle?.registrationNumber],
    ["KM OUT", trip.kmOut],
    ["KM IN", trip.kmIn],
    ["Total KM", trip.totalKm],
    ["Toll", trip.tollCharges],
    ["Parking", trip.parkingCharges],
    ["Extras", trip.extraCharges]
  ];
  return <div className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-md border border-slate-200 p-3 dark:border-slate-800"><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-900 dark:text-white">{value ?? "-"}</p></div>)}</div>;
}

function tripDefaults(trip: any) {
  return {
    status: trip?.status || "Assigned",
    kmOut: trip?.kmOut ?? "",
    kmIn: trip?.kmIn ?? "",
    timeOut: trip?.timeOut ? toDatetimeLocal(trip.timeOut) : "",
    timeIn: trip?.timeIn ? toDatetimeLocal(trip.timeIn) : "",
    tollCharges: trip?.tollCharges || 0,
    parkingCharges: trip?.parkingCharges || 0,
    extraCharges: trip?.extraCharges || 0,
    userClosingKm: trip?.userClosingKm || trip?.kmIn || 0
  };
}

function toDatetimeLocal(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const optionalNumber = z.preprocess((value: unknown) => {
  if (value === "" || value === null || Number.isNaN(value)) return undefined;
  return value;
}, z.coerce.number().min(0).optional());

const tripStatusSchema = z.object({
  status: z.enum(["Assigned", "In Trip", "Completed", "Cancelled"]),
  kmOut: optionalNumber,
  kmIn: optionalNumber,
  timeOut: z.string().optional(),
  timeIn: z.string().optional(),
  tollCharges: optionalNumber.default(0),
  parkingCharges: optionalNumber.default(0),
  extraCharges: optionalNumber.default(0),
  userClosingKm: optionalNumber
}).superRefine((values, ctx) => {
  if (values.status === "In Trip") {
    if (values.kmOut === undefined) ctx.addIssue({ code: "custom", path: ["kmOut"], message: "KM OUT is required when trip is In Trip" });
    if (!values.timeOut) ctx.addIssue({ code: "custom", path: ["timeOut"], message: "Time OUT is required when trip is In Trip" });
  }

  if (values.status === "Completed") {
    if (values.kmOut === undefined) ctx.addIssue({ code: "custom", path: ["kmOut"], message: "KM OUT is required" });
    if (values.kmIn === undefined) ctx.addIssue({ code: "custom", path: ["kmIn"], message: "KM IN is required" });
    if (!values.timeOut) ctx.addIssue({ code: "custom", path: ["timeOut"], message: "Time OUT is required" });
    if (!values.timeIn) ctx.addIssue({ code: "custom", path: ["timeIn"], message: "Time IN is required" });
    if (values.kmIn !== undefined && values.kmOut !== undefined && values.kmIn < values.kmOut) ctx.addIssue({ code: "custom", path: ["kmIn"], message: "KM IN must be greater than or equal to KM OUT" });
    if (values.timeOut && values.timeIn && new Date(values.timeIn) <= new Date(values.timeOut)) {
      ctx.addIssue({ code: "custom", path: ["timeIn"], message: "Time IN must be after Time OUT" });
    }
  }
});

function TripStatusBadge({ status }: { status: string }) {
  const className = status === "Completed"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
    : status === "Cancelled"
      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
    : status === "In Trip"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}


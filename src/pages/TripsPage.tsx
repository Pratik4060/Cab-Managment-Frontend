import { ClipboardCheck, FileText, Pencil, Plus, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { bookingActions } from "../redux/slices/bookingSlice";
import { invoiceActions } from "../redux/slices/invoiceSlice";
import { driverActions } from "../redux/slices/driverSlice";
import { tripActions, updateTripStatus } from "../redux/slices/tripSlice";
import { vehicleActions } from "../redux/slices/vehicleSlice";

type DutySlipFormState = {
  kmOut: string;
  kmIn: string;
  timeOut: string;
  timeIn: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstCharges: string;
};

export function TripsPage() {
  const dispatch = useAppDispatch();
  const [syncOpen, setSyncOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [dutySlipOpen, setDutySlipOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [activeTable, setActiveTable] = useState<"new" | "assigned">("new");
  const bookings = useAppSelector((state) => state.bookings.items);
  const trips = useAppSelector((state) => state.trips.allItems);
  const loading = useAppSelector((state) => state.trips.loading);
  const drivers = useAppSelector((state) => state.drivers.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  useEffect(() => {
    dispatch(tripActions.fetchAll(undefined));
    dispatch(bookingActions.fetchAll(undefined));
    dispatch(driverActions.fetchAll(undefined));
    dispatch(vehicleActions.fetchAll(undefined));
  }, [dispatch]);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "New"),
    [bookings]
  );
  const assignedTrips = useMemo(
    () => trips.filter((trip) => trip.status === "Assigned"),
    [trips]
  );

  const availableDrivers = drivers.filter((driver) => driver.status === "Available");
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");

  const inquiryFields = [
    {
      name: "bookingId",
      label: "Booking ID",
      placeholder: "Auto generated",
      disabled: true
    },
    { name: "businessUnit", label: "Business Unit", required: false },
    { name: "passengerName", label: "Passenger Name" },
    { name: "mobileNumber", label: "Mobile Number", required: false },
    { name: "reportingAddress", label: "Reporting Address", full: true, required: false },
    { name: "dropAddress", label: "Drop Address", full: true, required: false },
    { name: "carType", label: "Car Type", required: false },
    { name: "cabRequestNumber", label: "Cab Request No", required: false },
    { name: "senderEmail", label: "Sender Email", required: false }
  ];

  const assignFields = [
    {
      name: "driverId",
      label: "Driver",
      type: "select",
      placeholder: "Select available driver",
      options: availableDrivers.map((driver) => ({
        value: driver._id,
        label: `${driver.driverName} - ${driver.contactNumber}`
      }))
    },
    {
      name: "vehicleId",
      label: "Vehicle",
      type: "select",
      placeholder: "Select available vehicle",
      options: availableVehicles.map((vehicle) => ({
        value: vehicle._id,
        label: `${vehicle.registrationNumber} - ${vehicle.vehicleModel} (${vehicle.cabType || vehicle.cabCategory || "Cab"})`
      }))
    }
  ];

  const pendingColumns = [
    { key: "bookingId", header: "Booking ID" },
    { key: "businessUnit", header: "Business Unit" },
    { key: "passengerName", header: "Passenger" },
    { key: "mobileNumber", header: "Mobile" },
    { key: "reportingAddress", header: "Reporting Address" },
    { key: "dropAddress", header: "Drop Address" },
    { key: "carType", header: "Car Type" },
    { key: "cabRequestNumber", header: "Cab Request No" },
    { key: "senderEmail", header: "Email" },
    { key: "status", header: "Status", render: (row: any) => <BookingStatusBadge status={row.status} /> }
  ];

  const assignedColumns = [
    { key: "bookingId", header: "Booking ID", render: (row: any) => row.booking?.bookingId || row.bookingId || "-" },
    { key: "businessUnit", header: "Business Unit", render: (row: any) => row.booking?.businessUnit || "-" },
    { key: "passengerName", header: "Passenger", render: (row: any) => row.booking?.passengerName || "-" },
    { key: "mobileNumber", header: "Mobile", render: (row: any) => row.booking?.mobileNumber || "-" },
    { key: "reportingAddress", header: "Reporting Address", render: (row: any) => row.booking?.reportingAddress || "-" },
    { key: "dropAddress", header: "Drop Address", render: (row: any) => row.booking?.dropAddress || "-" },
    { key: "carType", header: "Car Type", render: (row: any) => row.booking?.carType || "-" },
    { key: "cabRequestNumber", header: "Cab Request No", render: (row: any) => row.booking?.cabRequestNumber || "-" },
    { key: "senderEmail", header: "Email", render: (row: any) => row.booking?.senderEmail || "-" },
    { key: "status", header: "Trip Status", render: (row: any) => <BookingStatusBadge status={row.status || "Assigned"} /> },
    { key: "driver", header: "Driver", render: (row: any) => row.driver?.driverName || "-" },
    { key: "vehicle", header: "Cab", render: (row: any) => row.vehicle ? `${row.vehicle.registrationNumber}${row.vehicle.vehicleModel ? ` - ${row.vehicle.vehicleModel}` : ""}` : "-" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trips</h1>
          <p className="text-sm text-slate-500">New enquiries on the left, assigned trips on the right.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          className={`panel border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${activeTable === "new" ? "border-red-500 shadow-lg dark:border-red-400" : "border-slate-200 dark:border-slate-800"}`}
          onClick={() => setActiveTable("new")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">New</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                  {pendingBookings.length}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Click to jump to the new bookings table.</p>
            </div>
            <span className="rounded-full bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <Plus className="h-5 w-5" />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`panel border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${activeTable === "assigned" ? "border-red-500 shadow-lg dark:border-red-400" : "border-slate-200 dark:border-slate-800"}`}
          onClick={() => setActiveTable("assigned")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Assigned</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                  {assignedTrips.length}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Click to jump to the assigned trips table.</p>
            </div>
            <span className="rounded-full bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              <ClipboardCheck className="h-5 w-5" />
            </span>
          </div>
        </button>
      </div>

      {activeTable === "new" ? (
        <section className="panel p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Trips</h2>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                  {pendingBookings.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">New booking enquiries ready to be assigned.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="btn-secondary"
                // onClick={() => setSyncOpen(true)}
              >
                <RefreshCcw className="h-4 w-4" />
                Sync with Email
              </button>
              <button
                className="btn-primary"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Trip
              </button>
            </div>
          </div>

          <DataTable
            loading={loading}
            rows={pendingBookings}
            columns={pendingColumns}
          actions={(row) => (
            <div className="flex min-w-44 items-center justify-end gap-2">
              <button
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedBooking(row);
                    setEditOpen(true);
                  }}
              >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              <button
                  className="btn-secondary whitespace-nowrap"
                  onClick={() => {
                    setSelectedBooking(row);
                    setAssignOpen(true);
                  }}
              >
                  Assign Trip
                </button>
              </div>
            )}
          />
        </section>
      ) : (
        <section className="panel p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Assigned Trips</h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                  {assignedTrips.length}   
                </span>   
              </div>
              <p className="mt-1 text-sm text-slate-500">Trips that already have a driver and vehicle assigned.</p>
            </div>
          </div>

          <DataTable
            loading={loading}
            rows={assignedTrips}
            columns={assignedColumns}
          actions={(row) => (
            <div className="flex min-w-44 items-center justify-end gap-2">
              <button
                  className="btn-secondary p-2"
                  title="Generate duty slip"
                  onClick={() => {
                    setSelectedTrip(row);
                    setDutySlipOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        </section>
      )}

      <Modal open={addOpen} title="Add Trip" onClose={() => setAddOpen(false)}>
        <EntityForm
          fields={inquiryFields}
          schema={z.object({
            bookingId: z.string().optional(),
            businessUnit: z.string().optional(),
            passengerName: z.string().min(1, "Passenger name is required"),
            mobileNumber: z.string().optional(),
            reportingAddress: z.string().optional(),
            dropAddress: z.string().optional(),
            carType: z.string().optional(),
            cabRequestNumber: z.string().optional(),
            senderEmail: z.string().optional()
          })}
          defaults={{ bookingId: "Auto generated" }}
          submitLabel="Save Trip"
          onSubmit={async (values) => {
            await dispatch(bookingActions.createOne({ ...values, status: "New" }));
            setAddOpen(false);
          }}
        />
      </Modal>

      <Modal open={syncOpen} title="Sync with Email" onClose={() => setSyncOpen(false)}>
        <EntityForm
          fields={[
            { name: "senderEmail", label: "Sender Email", type: "email", full: true }
          ]}
          schema={z.object({
            senderEmail: z.string().email("Valid email is required")
          })}
          submitLabel="Sync"
          onSubmit={async (values) => {
            dispatch(bookingActions.fetchAll({ senderEmail: values.senderEmail }));
            setSyncOpen(false);
          }}
        />
      </Modal>

      <Modal open={editOpen} title="Edit Trip" onClose={() => setEditOpen(false)}>
        {selectedBooking && (
          <EntityForm
            fields={inquiryFields}
            schema={z.object({
              bookingId: z.string().optional(),
              businessUnit: z.string().optional(),
              passengerName: z.string().min(1, "Passenger name is required"),
              mobileNumber: z.string().optional(),
              reportingAddress: z.string().optional(),
              dropAddress: z.string().optional(),
              carType: z.string().optional(),
              cabRequestNumber: z.string().optional(),
              senderEmail: z.string().optional()
            })}
            defaults={{
              bookingId: selectedBooking.bookingId,
              businessUnit: selectedBooking.businessUnit,
              passengerName: selectedBooking.passengerName,
              mobileNumber: selectedBooking.mobileNumber,
              reportingAddress: selectedBooking.reportingAddress,
              dropAddress: selectedBooking.dropAddress,
              carType: selectedBooking.carType,
              cabRequestNumber: selectedBooking.cabRequestNumber,
              senderEmail: selectedBooking.senderEmail
            }}
            submitLabel="Update Trip"
            onSubmit={async (values) => {
              await dispatch(bookingActions.updateOne({ id: selectedBooking._id, payload: { ...values, status: selectedBooking.status || "New" } }));
              setEditOpen(false);
              setSelectedBooking(null);
            }}
          />
        )}
      </Modal>

      <Modal open={assignOpen} title="Assign Trip" onClose={() => setAssignOpen(false)}>
        {selectedBooking && (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">Selected Booking</p>
            <p className="mt-1 font-medium">{selectedBooking.passengerName || "Unnamed passenger"} - {selectedBooking.cabRequestNumber || selectedBooking.bookingId}</p>
          </div>
        )}
        {(!pendingBookings.length || !availableDrivers.length || !availableVehicles.length) && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {!pendingBookings.length && <p>No new enquiries are available.</p>}
            {!availableDrivers.length && <p>No available drivers are available.</p>}
            {!availableVehicles.length && <p>No available vehicles are available.</p>}
          </div>
        )}
        <EntityForm
          fields={assignFields}
          defaults={{ driverId: "", vehicleId: "" }}
          schema={z.object({
            driverId: z.string().min(1),
            vehicleId: z.string().min(1)
          })}
          submitLabel="Assign"
          onSubmit={async (values) => {
            await dispatch(tripActions.assignTrip({ ...values, bookingId: selectedBooking?._id }));
            await dispatch(tripActions.fetchAll(undefined));
            setAssignOpen(false);
            setSelectedBooking(null);
          }}
        />
      </Modal>

      <Modal
        open={dutySlipOpen}
        title={`Duty Slip Generation ${selectedTrip?.tripNumber || ""}`}
        onClose={() => {
          setDutySlipOpen(false);
          setSelectedTrip(null);
        }}
      >
        {selectedTrip && (
          <DutySlipEditor
            trip={selectedTrip}
            onCancel={() => {
              setDutySlipOpen(false);
              setSelectedTrip(null);
            }}
            onSave={async (payload) => {
              await dispatch(updateTripStatus({ id: selectedTrip._id, payload }));
              await dispatch(invoiceActions.generateInvoice({ ...selectedTrip, ...payload, trip: { ...(selectedTrip.trip || {}), ...payload } }));
              setDutySlipOpen(false);
              setSelectedTrip(null);
            }}
          />
        )}
      </Modal>

    </div>
  );
}

function DutySlipEditor({ trip, onSave, onCancel }: { trip: any; onSave: (payload: any) => Promise<void> | void; onCancel: () => void }) {
  const [form, setForm] = useState<DutySlipFormState>(() => buildDutySlipState(trip));

  useEffect(() => {
    setForm(buildDutySlipState(trip));
  }, [trip]);

  const totalKm = calculateTotalKm(form.kmOut, form.kmIn);

  function updateField(field: keyof DutySlipFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    await onSave({
      kmOut: normalizeNumber(form.kmOut),
      kmIn: normalizeNumber(form.kmIn),
      totalKm,
      timeOut: form.timeOut || undefined,
      timeIn: form.timeIn || undefined,
      tollCharges: normalizeNumber(form.tollCharges),
      parkingCharges: normalizeNumber(form.parkingCharges),
      extraCharges: normalizeNumber(form.extraCharges)
      ,gstCharges: normalizeNumber(form.gstCharges)
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TripCard label="Trip" value={trip.tripNumber} />
        <TripCard label="Passenger" value={trip.booking?.passengerName || "-"} />
        <TripCard label="Driver" value={trip.driver?.driverName || "-"} />
        <TripCard label="Vehicle" value={trip.vehicle ? `${trip.vehicle.registrationNumber}${trip.vehicle.vehicleModel ? ` - ${trip.vehicle.vehicleModel}` : ""}` : "-"} />
        <TripCard label="KM OUT" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmOut} onChange={(event) => updateField("kmOut", event.target.value)} />} />
        <TripCard label="KM IN" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmIn} onChange={(event) => updateField("kmIn", event.target.value)} />} />
        <TripCard label="Time OUT" value={<input className="input mt-1" type="datetime-local" value={form.timeOut} onChange={(event) => updateField("timeOut", event.target.value)} />} />
        <TripCard label="Time IN" value={<input className="input mt-1" type="datetime-local" value={form.timeIn} onChange={(event) => updateField("timeIn", event.target.value)} />} />
        <TripCard label="Toll" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.tollCharges} onChange={(event) => updateField("tollCharges", event.target.value)} />} />
        <TripCard label="Parking" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.parkingCharges} onChange={(event) => updateField("parkingCharges", event.target.value)} />} />
        <TripCard label="Extras" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.extraCharges} onChange={(event) => updateField("extraCharges", event.target.value)} />} />
        <TripCard label="GST (%)" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.gstCharges} onChange={(event) => updateField("gstCharges", event.target.value)} />} />
        <TripCard label="Total KM" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{totalKm.toLocaleString()}</p>} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-primary" onClick={handleSave}>Generate Invoice</button>
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const normalized = status === "New" ? "New" : "Assigned";
  const className = normalized === "Assigned"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}>{normalized}</span>;
}

function TripCard({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm text-slate-900 dark:text-white">{value ?? "-"}</div>
    </div>
  );
}

function buildDutySlipState(trip: any): DutySlipFormState {
  return {
    kmOut: trip?.kmOut === undefined || trip?.kmOut === null ? "" : String(trip.kmOut),
    kmIn: trip?.kmIn === undefined || trip?.kmIn === null ? "" : String(trip.kmIn),
    timeOut: trip?.timeOut ? toDatetimeLocal(trip.timeOut) : "",
    timeIn: trip?.timeIn ? toDatetimeLocal(trip.timeIn) : "",
    tollCharges: String(trip?.tollCharges ?? 0),
    parkingCharges: String(trip?.parkingCharges ?? 0),
    extraCharges: String(trip?.extraCharges ?? 0)
    ,gstCharges: String(trip?.gstCharges ?? 5)
  };
}

function calculateTotalKm(kmOut: string, kmIn: string) {
  const out = normalizeNumber(kmOut);
  const incoming = normalizeNumber(kmIn);
  if (out === null || incoming === null) return 0;
  return incoming >= out ? incoming - out : 0;
}

function normalizeNumber(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDatetimeLocal(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

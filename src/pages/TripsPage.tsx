import {
  Ban,
  ClipboardCheck,
  Eye,
  FileText,
  Pencil,
  Plus,
  RefreshCcw,
  Route,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { bookingActions } from "../redux/slices/bookingSlice";
import { bookingApi } from "../api/bookingApi";
import { driverActions } from "../redux/slices/driverSlice";
import { vehicleActions } from "../redux/slices/vehicleSlice";
import { formatDisplayDate, shouldFormatAsDate } from "../utils/formatDate";
import { showToast } from "../utils/toast";

type DutySlipFormState = {
  kmOut: string;
  kmIn: string;
  timeOut: string;
  timeIn: string;
  closingKm: string;
  closingTime: string;
  closingLocation: string;
  dutySlipPhoto: string;
  projectType: string;
  billingAddress: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstCharges: string;
  perKmCharges: string;
};

export function TripsPage() {
  const dispatch = useAppDispatch();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [dutySlipOpen, setDutySlipOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [viewDetails, setViewDetails] = useState<any>(null);
  const [dutySlipDetails, setDutySlipDetails] = useState<any>(null);
  const [dutySlipFetchError, setDutySlipFetchError] = useState<string | null>(null);
  const [loadingDutySlip, setLoadingDutySlip] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "new" | "assigned"; item: any } | null>(null);
  const [activeTable, setActiveTable] = useState<"new" | "assigned" | "closed">("new");
  const bookingState = useAppSelector((state) => state.bookings);
  const newBookingItems = bookingState.bucketItems?.New || [];
  const confirmedBookingItems = bookingState.bucketItems?.Confirmed || [];
  const closedBookingItems = bookingState.bucketItems?.CompletedCancelled || [];
  const loading = bookingState.loading;
  const drivers = useAppSelector((state) => state.drivers.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  useEffect(() => {
    dispatch(bookingActions.fetchBookingBuckets());
  }, [dispatch]);

  useEffect(() => {
    dispatch(driverActions.fetchAll(undefined));
    dispatch(vehicleActions.fetchAll(undefined));
  }, [dispatch]);

  const pendingBookings = useMemo(() => newBookingItems || [], [newBookingItems]);

  const assignedTrips = useMemo(
    () => (confirmedBookingItems || []).filter((b) => b.status === "Confirmed").map((booking) => buildAssignedTripFromBooking(booking, drivers, vehicles)),
    [confirmedBookingItems, drivers, vehicles],
  );
  const closedTrips = useMemo(
    () => (closedBookingItems || []).map((booking) => buildAssignedTripFromBooking(booking, drivers, vehicles)),
    [closedBookingItems, drivers, vehicles],
  );

  const availableDrivers = drivers.filter(
    (driver) => driver.status === "Available",
  );
  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "Available",
  );

  async function handleCancelNewTrip(booking: any) {
    if (!booking?._id) return;
    await dispatch(bookingActions.cancelBooking(booking._id)).unwrap();
    await dispatch(bookingActions.fetchBookingBuckets());
  }

  async function handleCancelAssignedTrip(trip: any) {
    if (!trip?._id) return;
    await dispatch(bookingActions.cancelBooking(trip._id)).unwrap();
    await dispatch(bookingActions.fetchBookingBuckets());
  }

  async function handleOpenDutySlipDetails(row: any) {
    const bookingId = row.bookingId || row._id || row.booking?._id || row.booking?.bookingId;
    if (!bookingId) {
      showToast({ type: "error", title: "Unable to load duty slip", message: "Invalid booking information provided." });
      return;
    }

    setDutySlipDetails(null);
    setDutySlipFetchError(null);
    setLoadingDutySlip(true);
    setViewDetails({ type: "dutySlip", data: row });

    try {
      const details = await bookingApi.getDutySlipDetails(String(bookingId));
      setDutySlipDetails(details);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unable to load duty slip details.";
      const isNotFound = (error as any)?.status === 404 || errorMessage.toLowerCase().includes("not found");

      if (isNotFound) {
        showToast({ type: "info", title: "Duty slip not found", message: "No duty slip found for this booking." });
        setDutySlipFetchError("No duty slip details were found for this booking.");
      } else {
        showToast({ type: "error", title: "Could not load duty slip", message: errorMessage });
        setDutySlipFetchError("Unable to load duty slip details. Please try again.");
      }
    } finally {
      setLoadingDutySlip(false);
    }
  }

  function clearDutySlipDetails() {
    setDutySlipDetails(null);
    setDutySlipFetchError(null);
    setLoadingDutySlip(false);
  }

  const inquiryFields = [
    {
      name: "bookingId",
      label: "Booking ID",
      placeholder: "Auto generated",
      disabled: true,
    },
    { name: "cabRequestNumber", label: "Cab Request No", required: false },
    { name: "businessUnit", label: "Business Unit", required: false },
    { name: "passengerName", label: "Name of Passenger" },
    { name: "mobileNumber", label: "Mobile Number", required: false },
    {
      name: "travelStartDate",
      label: "Travel Start Date",
      type: "datetime-local",
    },
    {
      name: "travelEndDate",
      label: "Travel End Date",
      type: "datetime-local",
    },
    { name: "departmentName", label: "Department Name", required: false },
    {
      name: "reportingAddress",
      label: "Reporting Address",
      full: true,
      required: false,
    },
    { name: "dropAddress", label: "Drop Address", full: true, required: false },
    {
      name: "carType",
      label: "Car Type",
      type: "select",
      options: ["Hatchback", "Sedan", "SUV", "MUV/MPV"],
      required: false,
    },
    {
      name: "projectExpenses",
      label: "Project Expenses",
      type: "select",
      options: ["Yes", "No"],
      required: false,
    },
    {
      name: "costCenterOfProject",
      label: "Cost Center Of Project",
      required: false,
    },
    { name: "bookedBy", label: "Booked By", required: false },
    {
      name: "employeeCount",
      label: "Employee Count",
      type: "number",
      min: 0,
      required: false,
    },
    {
      name: "purposeOfCabBooking",
      label: "Purpose of Cab Booking",
      full: true,
      required: false,
    },
    { name: "senderEmail", label: "Sender Email", required: false },
    {
      name: "emailScreenshot",
      label: "Email Screenshot",
      type: "file",
      accept: "image/*",
      full: true,
      required: false,
    },
  ];

  const assignFields = [
    {
      name: "driverId",
      label: "Driver",
      type: "select",
      placeholder: "Select available driver",
      options: availableDrivers.map((driver) => ({
        value: driver._id,
        label: `${driver.driverName} - ${driver.contactNumber}`,
      })),
    },
    {
      name: "vehicleId",
      label: "Vehicle",
      type: "select",
      placeholder: "Select available vehicle",
      options: availableVehicles.map((vehicle) => ({
        value: vehicle._id,
        label: `${vehicle.registration_number || vehicle.registrationNumber} - ${vehicle.vehicle_model || vehicle.vehicleModel} (${vehicle.cab_type || vehicle.cabType || vehicle.cabCategory || "Cab"})`,
      })),
    },
  ];

  const pendingColumns = [
    { key: "bookingId", header: "Booking ID" },
    { key: "businessUnit", header: "Business Unit" },
    { key: "passengerName", header: "Passenger" },
    { key: "mobileNumber", header: "Mobile" },
    { key: "carType", header: "Car Type" },
    { key: "cabRequestNumber", header: "Cab Request No" },
  ];

  const assignedColumns = [
    {
      key: "bookingId",
      header: "Booking ID",
      render: (row: any) => row.booking?.bookingId || row.bookingId || "-",
    },
    {
      key: "businessUnit",
      header: "Business Unit",
      render: (row: any) => row.booking?.businessUnit || "-",
    },
    {
      key: "passengerName",
      header: "Passenger",
      render: (row: any) => row.booking?.passengerName || "-",
    },
    {
      key: "mobileNumber",
      header: "Mobile",
      render: (row: any) => row.booking?.mobileNumber || "-",
    },
    {
      key: "carType",
      header: "Car Type",
      render: (row: any) => row.booking?.carType || "-",
    },
    {
      key: "cabRequestNumber",
      header: "Cab Request No",
      render: (row: any) => row.booking?.cabRequestNumber || "-",
    },
    {
      key: "driver",
      header: "Driver",
      render: (row: any) => row.driver?.driverName || "-",
    },
    // { key: "vehicle", header: "Cab", render: (row: any) => row.vehicle ? `${row.vehicle.registrationNumber}${row.vehicle.vehicleModel ? ` - ${row.vehicle.vehicleModel}` : ""}` : "-" }
  ];
  const closedColumns = [
    ...assignedColumns,
    {
      key: "status",
      header: "Status",
      render: (row: any) => <TripStatusBadge status={row.booking?.status || row.status} />
    }
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Bookings</h1>
          <p className="text-sm text-slate-500">
            New enquiries on the left, assigned bookings on the right.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          className={`group relative overflow-hidden rounded-xl border border-l-[4px] p-4 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl dark:bg-gradient-to-br dark:from-[#181113] dark:to-[#0e0e10] ${activeTable === "new" ? "border-brand-500 border-l-brand-600 shadow-brand-600/20 dark:border-brand-400 dark:border-l-brand-400" : "border-brand-100/80 border-l-brand-600/80 dark:border-red-950/35 dark:border-l-brand-400/70"}`}
          onClick={() => setActiveTable("new")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  New
                </h2>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
                  {pendingBookings.length}
                </span>
              </div>
              <p className="mt-2.5 text-sm text-slate-500">
                Click to jump to the new bookings table.
              </p>
            </div>
            <span className="rounded-full bg-brand-50 p-2.5 text-brand-700 transition group-hover:scale-105 dark:bg-brand-950/40 dark:text-brand-200">
              <ClipboardList className="h-4 w-4" />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`group relative overflow-hidden rounded-xl border border-l-[4px] p-4 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl dark:bg-gradient-to-br dark:from-[#181113] dark:to-[#0e0e10] ${activeTable === "assigned" ? "border-brand-500 border-l-brand-600 shadow-brand-600/20 dark:border-brand-400 dark:border-l-brand-400" : "border-brand-100/80 border-l-brand-600/80 dark:border-red-950/35 dark:border-l-brand-400/70"}`}
          onClick={() => setActiveTable("assigned")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Assigned
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-zinc-900 dark:text-brand-300">
                  {assignedTrips.length}
                </span>
              </div>
              <p className="mt-2.5 text-sm text-slate-500">
                Click to jump to the assigned trips table.
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 p-2.5 text-brand-700 transition group-hover:scale-105 dark:bg-zinc-900 dark:text-brand-300">
              <Route className="h-4 w-4" />
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`group relative overflow-hidden rounded-xl border border-l-[4px] p-4 text-left shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl dark:bg-gradient-to-br dark:from-[#181113] dark:to-[#0e0e10] ${activeTable === "closed" ? "border-brand-500 border-l-brand-600 shadow-brand-600/20 dark:border-brand-400 dark:border-l-brand-400" : "border-brand-100/80 border-l-brand-600/80 dark:border-red-950/35 dark:border-l-brand-400/70"}`}
          onClick={() => setActiveTable("closed")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  Completed / Cancelled
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-zinc-900 dark:text-brand-300">
                  {closedTrips.length}
                </span>
              </div>
              <p className="mt-2.5 text-sm text-slate-500">
               Click to jump to the Completed/cancelled trip history.
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 p-2.5 text-brand-700 transition group-hover:scale-105 dark:bg-zinc-900 dark:text-brand-300">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
        </button>
      </div>

      {activeTable === "new" ? (
        <section className="panel p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                 New Bookings
                </h2>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-200">
                  {pendingBookings.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                New booking enquiries ready to be assigned.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="btn-secondary"
                disabled={loading}
                onClick={async () => {
                  try {
                    const result = await dispatch(bookingActions.scanMails()).unwrap();
                    const insertedCount = Number(result?.insertedCount || 0);
                    showToast({
                      type: insertedCount > 0 ? "success" : "info",
                      title: insertedCount > 0 ? "New Bookings Found" : "No Bookings Found",
                      message: insertedCount > 0
                        ? `${insertedCount} new booking${insertedCount === 1 ? "" : "s"} imported from mail.`
                        : "No new bookings were found in the latest mail scan."
                    });
                    setActiveTable("new");
                    await dispatch(bookingActions.fetchBookingBuckets());
                  } catch {
                    // API interceptor already shows the readable error toast.
                  }
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Scan Mail
              </button>
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Booking
              </button>
            </div>
          </div>

          <DataTable
            loading={loading}
            loadingMessage={bookingState.requestMessage || "Loading new trips..."}
            rows={pendingBookings}
            columns={pendingColumns}
            actionCount={4}
            actions={(row) => (
              <div className="flex min-w-40 flex-col gap-2">
                <button
                  className="btn-secondary w-full justify-start p-2"
                  onClick={() => setViewDetails({ type: "booking", data: row })}
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2"
                  onClick={() => {
                    setSelectedBooking(row);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2 whitespace-nowrap"
                  onClick={() => {
                    setSelectedBooking(row);
                    setAssignOpen(true);
                  }}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Assign Booking</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                  onClick={() => setDeleteTarget({ type: "new", item: row })}
                >
                  <Ban className="h-4 w-4" />
                  <span>Cancel Booking</span>
                </button>
              </div>
            )}
          />
        </section>
      ) : activeTable === "assigned" ? (
        <section className="panel p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Assigned Bookings
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-zinc-900 dark:text-brand-300">
                  {assignedTrips.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Trips that already have a driver and vehicle assigned.
              </p>
            </div>
          </div>

          <DataTable
            loading={loading}
            loadingMessage={bookingState.requestMessage || "Loading assigned trips..."}
            rows={assignedTrips}
            columns={assignedColumns}
            actionCount={3}
            actions={(row) => (
              <div className="flex min-w-40 flex-col gap-2">
                <button
                  className="btn-secondary w-full justify-start p-2"
                  title="View details"
                  onClick={() => setViewDetails({ type: "trip", data: row })}
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2"
                  title="Generate duty slip"
                  onClick={() => {
                    setSelectedTrip(row);
                    setDutySlipOpen(true);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Duty Slip</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                  title="Cancel trip"
                  onClick={() => setDeleteTarget({ type: "assigned", item: row })}
                >
                  <Ban className="h-4 w-4" />
                  <span>Cancel Booking</span>
                </button>
              </div>
            )}
          />
        </section>
      ) : (
        <section className="panel p-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                  Completed / Cancelled Bookings
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-zinc-900 dark:text-brand-300">
                  {closedTrips.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Historical trips with final status.
              </p>
            </div>
          </div>

          <DataTable
            loading={loading}
            loadingMessage={bookingState.requestMessage || "Loading completed and cancelled trips..."}
            rows={closedTrips}
            columns={closedColumns}
            actionCount={2}
            actions={(row) => (
              <div className="flex min-w-40 flex-col gap-2">
                <button
                  className="btn-secondary w-full justify-start p-2"
                  title="View details"
                  onClick={() => setViewDetails({ type: "trip", data: row })}
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  className="btn-secondary w-full justify-start p-2"
                  title="View duty slip"
                  onClick={() => handleOpenDutySlipDetails(row)}
                >
                  <FileText className="h-4 w-4" />
                  <span>View Duty Slip</span>
                </button>
              </div>
            )}
          />
        </section>
      )}

      <Modal open={addOpen} title="Add Booking" onClose={() => setAddOpen(false)}>
        <EntityForm
          fields={inquiryFields}
          schema={z.object({
            bookingId: z.string().optional(),
            cabRequestNumber: z.string().optional(),
            businessUnit: z.string().optional(),
            passengerName: z.string().min(1, "Passenger name is required"),
            mobileNumber: optionalMobileNumber(),
            travelStartDate: z.string().min(1, "Travel start date is required").refine((value) => !Number.isNaN(new Date(value).getTime()), "Please enter a valid travel start date"),
            travelEndDate: z.string().min(1, "Travel end date is required").refine((value) => !Number.isNaN(new Date(value).getTime()), "Please enter a valid travel end date"),
            departmentName: z.string().optional(),
            reportingAddress: z.string().optional(),
            dropAddress: z.string().optional(),
            carType: z.string().optional(),
            projectExpenses: z.string().optional(),
            costCenterOfProject: z.string().optional(),
            bookedBy: z.string().optional(),
            employeeCount: optionalNumber(),
            purposeOfCabBooking: z.string().optional(),
            senderEmail: z.string().optional(),
            emailScreenshot: z.any().optional(),
          }).refine((data) => {
            const start = new Date(data.travelStartDate);
            const end = new Date(data.travelEndDate);
            return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start < end;
          }, {
            message: "Travel start date must be before travel end date",
            path: ["travelEndDate"],
          })}
          defaults={{ bookingId: "Auto generated" }}
          submitLabel="Save Booking"
          onSubmit={async (values) => {
            await dispatch(
              bookingActions.createOne({ ...values, status: "New" }),
            ).unwrap();
            await dispatch(bookingActions.fetchBookingBuckets());
            setAddOpen(false);
          }}
        />
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Booking"
        onClose={() => setEditOpen(false)}
      >
        {selectedBooking && (
          <EntityForm
            fields={inquiryFields}
            schema={z.object({
              bookingId: z.string().optional(),
              cabRequestNumber: z.string().optional(),
              businessUnit: z.string().optional(),
              passengerName: z.string().min(1, "Passenger name is required"),
              mobileNumber: optionalMobileNumber(),
              travelStartDate: z.string().optional(),
              travelEndDate: z.string().optional(),
              departmentName: z.string().optional(),
              reportingAddress: z.string().optional(),
              dropAddress: z.string().optional(),
              carType: z.string().optional(),
              projectExpenses: z.string().optional(),
              costCenterOfProject: z.string().optional(),
              bookedBy: z.string().optional(),
              employeeCount: optionalNumber(),
              purposeOfCabBooking: z.string().optional(),
              senderEmail: z.string().optional(),
              emailScreenshot: z.any().optional(),
            })}
            defaults={{
              bookingId: selectedBooking.bookingId,
              cabRequestNumber: selectedBooking.cabRequestNumber,
              businessUnit: selectedBooking.businessUnit,
              passengerName: selectedBooking.passengerName,
              mobileNumber: selectedBooking.mobileNumber,
              travelStartDate: selectedBooking.travelStartDate,
              travelEndDate: selectedBooking.travelEndDate,
              departmentName: selectedBooking.departmentName,
              reportingAddress: selectedBooking.reportingAddress,
              dropAddress: selectedBooking.dropAddress,
              carType: selectedBooking.carType,
              projectExpenses: selectedBooking.projectExpenses,
              costCenterOfProject: selectedBooking.costCenterOfProject,
              bookedBy: selectedBooking.bookedBy,
              employeeCount: selectedBooking.employeeCount,
              purposeOfCabBooking: selectedBooking.purposeOfCabBooking,
              senderEmail: selectedBooking.senderEmail,
              emailScreenshot: selectedBooking.emailScreenshot,
            }}
            submitLabel="Update Booking"
            onSubmit={async (values) => {
              await dispatch(
                bookingActions.updateOne({
                  id: selectedBooking._id,
                  payload: {
                    ...values,
                    status: selectedBooking.status || "New",
                  },
                }),
              ).unwrap();
              await dispatch(bookingActions.fetchBookingBuckets());
              setEditOpen(false);
              setSelectedBooking(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={assignOpen}
        title="Assign Booking"
        onClose={() => setAssignOpen(false)}
      >
        {selectedBooking && (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Selected Booking
            </p>
            <p className="mt-1 font-medium">
              {selectedBooking.passengerName || "Unnamed passenger"} -{" "}
              {selectedBooking.cabRequestNumber || selectedBooking.bookingId}
            </p>
          </div>
        )}
        {(!pendingBookings.length ||
          !availableDrivers.length ||
          !availableVehicles.length) && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {!pendingBookings.length && <p>No new enquiries are available.</p>}
              {!availableDrivers.length && (
                <p>No available drivers are available.</p>
              )}
              {!availableVehicles.length && (
                <p>No available vehicles are available.</p>
              )}
            </div>
          )}
        <EntityForm
          fields={assignFields}
          defaults={{ driverId: "", vehicleId: "" }}
          schema={z.object({
            driverId: z.string().min(1),
            vehicleId: z.string().min(1),
          })}
          submitLabel="Assign"
          onSubmit={async (values) => {
            await dispatch(
              bookingActions.assignBooking({
                id: selectedBooking?._id,
                driverId: values.driverId,
                vehicleId: values.vehicleId,
              }),
            ).unwrap();
            setActiveTable("assigned");
            await dispatch(bookingActions.fetchBookingBuckets());
            setAssignOpen(false);
            setSelectedBooking(null);
          }}
        />
      </Modal>

      <Modal
        open={Boolean(viewDetails)}
        title={viewDetails?.type === "dutySlip" ? "Duty Slip Details" : "Booking Details"}
        onClose={() => {
          setViewDetails(null);
          clearDutySlipDetails();
        }}
      >
        {viewDetails?.type === "dutySlip" ? (
          <div className="space-y-4">
            {loadingDutySlip ? (
              <p className="text-sm text-slate-500">Loading duty slip details...</p>
            ) : dutySlipFetchError ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {dutySlipFetchError}
              </div>
            ) : dutySlipDetails ? (
              <DutySlipDetails data={dutySlipDetails} />
            ) : (
              <p className="text-sm text-slate-500">No duty slip details are available for this booking.</p>
            )}
          </div>
        ) : (
          viewDetails && <TripDetails data={viewDetails.data} />
        )}
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
              await dispatch(
                bookingActions.createDutySlip({
                  tripId: selectedTrip.tripId || selectedTrip._id,
                  bookingId: selectedTrip.bookingId || selectedTrip.booking?._id || selectedTrip._id,
                  driverId: selectedTrip.driverId,
                  vehicleId: selectedTrip.vehicleId,
                  ratePerKm: selectedTrip.vehicle?.rate_per_km ?? selectedTrip.vehicle?.ratePerKm,
                  ...payload
                }),
              ).unwrap();
              await dispatch(bookingActions.fetchBookingBuckets());
              setDutySlipOpen(false);
              setSelectedTrip(null);
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Cancel Trip"
        prompt="Are you sure you want to cancel this trip?"
        confirmLabel="Cancel Trip"
        message={
          deleteTarget?.type === "assigned"
            ? `This will cancel the assigned trip for ${deleteTarget.item?.booking?.passengerName || deleteTarget.item?.booking?.bookingId || deleteTarget.item?.tripNumber || "this trip"}.`
            : `This will cancel ${deleteTarget?.item?.passengerName || deleteTarget?.item?.bookingId || "this booking"}.`
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "new") {
            await handleCancelNewTrip(deleteTarget.item);
          } else {
            await handleCancelAssignedTrip(deleteTarget.item);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function DutySlipEditor({
  trip,
  onSave,
  onCancel,
}: {
  trip: any;
  onSave: (payload: any) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DutySlipFormState>(() =>
    buildDutySlipState(trip),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(buildDutySlipState(trip));
    setErrors({});
  }, [trip]);

  const totalKm = calculateTotalKm(form.kmOut, form.kmIn);
  const ratePerKm = normalizeNumber(form.perKmCharges) ?? Number(trip?.vehicle?.rate_per_km ?? trip?.vehicle?.ratePerKm ?? 0);
  const tollCharges = normalizeNumber(form.tollCharges) ?? 0;
  const parkingCharges = normalizeNumber(form.parkingCharges) ?? 0;
  const extraCharges = normalizeNumber(form.extraCharges) ?? 0;
  const gstRate = normalizeNumber(form.gstCharges) ?? 0;
  const tripFare = Math.round(totalKm * ratePerKm);
  const subTotal = tripFare + tollCharges + parkingCharges + extraCharges;
  const gstAmount = Math.round(subTotal * (gstRate / 100));
  const finalAmount = subTotal + gstAmount;

  const errorMessages = Object.values(errors);
  const hasErrors = errorMessages.length > 0;

  function updateField(field: keyof DutySlipFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateDutySlip() {
    const kmOutVal = normalizeNumber(form.kmOut);
    const kmInVal = normalizeNumber(form.kmIn);
    const perKmVal = normalizeNumber(form.perKmCharges);
    const timeOutVal = String(form.timeOut || "").trim();
    const timeInVal = String(form.timeIn || "").trim();
    const nextErrors: Record<string, string> = {};

    if (!trip.driverId && !trip.driver) {
      nextErrors.driver = "Please assign a driver for this trip.";
    }
    if (!trip.vehicleId && !trip.vehicle) {
      nextErrors.vehicle = "Please assign a vehicle for this trip.";
    }
    if (kmOutVal === null || kmOutVal < 0) {
      nextErrors.kmOut = "Please enter a valid KM OUT value.";
    }
    if (kmInVal === null || kmInVal < 0) {
      nextErrors.kmIn = "Please enter a valid KM IN value.";
    }
    if (kmOutVal !== null && kmInVal !== null && kmInVal <= kmOutVal) {
      nextErrors.kmIn = "KM IN must be greater than KM OUT.";
    }
    if (!timeOutVal) {
      nextErrors.timeOut = "Please select a Time OUT value.";
    }
    if (!timeInVal) {
      nextErrors.timeIn = "Please select a Time IN value.";
    }
    if (timeOutVal && timeInVal) {
      const outDate = new Date(timeOutVal);
      const inDate = new Date(timeInVal);
      if (Number.isNaN(outDate.getTime())) {
        nextErrors.timeOut = "Please enter a valid Time OUT value.";
      }
      if (Number.isNaN(inDate.getTime())) {
        nextErrors.timeIn = "Please enter a valid Time IN value.";
      }
      if (!nextErrors.timeOut && !nextErrors.timeIn && inDate <= outDate) {
        nextErrors.timeIn = "Time IN must be later than Time OUT.";
      }
    }
    if (perKmVal === null || perKmVal <= 0) {
      nextErrors.perKmCharges = "Please enter the vehicle charge per kilometer.";
    }
    if (normalizeNumber(form.gstCharges) === null) {
      nextErrors.gstCharges = "Please enter the GST percentage.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validateDutySlip()) return;
    await onSave({
      kmOut: normalizeNumber(form.kmOut),
      kmIn: normalizeNumber(form.kmIn),
      totalKm,
      timeOut: form.timeOut || undefined,
      timeIn: form.timeIn || undefined,
      closingKm: normalizeNumber(form.closingKm),
      closingTime: form.closingTime || undefined,
      closingLocation: form.closingLocation || undefined,
      dutySlipPhoto: form.dutySlipPhoto || undefined,
      projectType: form.projectType || undefined,
      billingAddress: form.billingAddress || undefined,
      tollCharges: normalizeNumber(form.tollCharges),
      parkingCharges: normalizeNumber(form.parkingCharges),
      extraCharges: normalizeNumber(form.extraCharges),
      gstCharges: normalizeNumber(form.gstCharges),
      perKmCharges: normalizeNumber(form.perKmCharges)
    });
  }

  return (
    <div className="space-y-4">
      {hasErrors && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Please fix the following duty slip fields:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {errorMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <TripCard label="Trip" value={trip.tripNumber} />
        <TripCard
          label="Passenger"
          value={trip.booking?.passengerName || "-"}
        />
        <TripCard label="Driver" value={trip.driver?.driverName || "-"} />
        <TripCard
          label="Vehicle"
          value={
            trip.vehicle
              ? `${trip.vehicle.registration_number || trip.vehicle.registrationNumber}${trip.vehicle.vehicle_model || trip.vehicle.vehicleModel ? ` - ${trip.vehicle.vehicle_model || trip.vehicle.vehicleModel}` : ""}`
              : "-"
          }
        />
        <TripCard
          label={<>KM OUT <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.kmOut}
                onChange={(event) => updateField("kmOut", event.target.value)}
              />
              {errors.kmOut && <p className="text-xs text-red-600">{errors.kmOut}</p>}
            </div>
          }
        />
        <TripCard
          label={<>KM IN <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.kmIn}
                onChange={(event) => updateField("kmIn", event.target.value)}
              />
              {errors.kmIn && <p className="text-xs text-red-600">{errors.kmIn}</p>}
            </div>
          }
        />
        <TripCard
          label="Total KM"
          value={
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {totalKm.toLocaleString()}
            </p>
          }
        />
        <TripCard
          label={<>Time OUT <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1"
                type="datetime-local"
                value={form.timeOut}
                onChange={(event) => updateField("timeOut", event.target.value)}
              />
              {errors.timeOut && <p className="text-xs text-red-600">{errors.timeOut}</p>}
            </div>
          }
        />
        <TripCard
          label={<>Time IN <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1"
                type="datetime-local"
                value={form.timeIn}
                onChange={(event) => updateField("timeIn", event.target.value)}
              />
              {errors.timeIn && <p className="text-xs text-red-600">{errors.timeIn}</p>}
            </div>
          }
        />
        <TripCard
          label="Closing KM"
          value={
            <input
              className="input mt-1"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={form.closingKm}
              onChange={(event) =>
                updateField("closingKm", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Closing Time"
          value={
            <input
              className="input mt-1"
              type="datetime-local"
              value={form.closingTime}
              onChange={(event) =>
                updateField("closingTime", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Closing Location"
          value={
            <input
              className="input mt-1"
              type="text"
              placeholder="Enter closing location"
              value={form.closingLocation}
              onChange={(event) =>
                updateField("closingLocation", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Project Type"
          value={
            <select
              className="input mt-1"
              value={form.projectType}
              onChange={(event) =>
                updateField("projectType", event.target.value)
              }
            >
              <option value="Process">Process</option>
              <option value="Management">Management</option>
            </select>
          }
        />
        <TripCard
          label="Address"
          value={
            <input
              className="input mt-1"
              type="text"
              placeholder="Enter address"
              value={form.billingAddress}
              onChange={(event) =>
                updateField("billingAddress", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Duty Slip Photo"
          value={
            <div className="space-y-1">
              <input
                className="input mt-1 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    updateField("dutySlipPhoto", "");
                    return;
                  }
                  updateField("dutySlipPhoto", await fileToDataUrl(file));
                }}
              />
              <p className="text-[11px] text-slate-500">
                {form.dutySlipPhoto ? "Duty slip photo attached." : "Upload the duty slip photo here."}
              </p>
              {form.dutySlipPhoto && (
                <div className="space-y-2">
                  <a href={form.dutySlipPhoto} target="_blank" rel="noreferrer" className="inline-flex rounded-md border border-brand-100 px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-red-950/40 dark:text-brand-200 dark:hover:bg-red-950/20">
                    View Duty Slip
                  </a>
                  <img
                    src={form.dutySlipPhoto}
                    alt="Duty slip preview"
                    className="max-h-40 w-full rounded-md border border-slate-200 object-contain dark:border-slate-800"
                  />
                </div>
              )}
            </div>
          }
        />
        <TripCard
          label="Toll"
          value={
            <input
              className="input mt-1"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={form.tollCharges}
              onChange={(event) =>
                updateField("tollCharges", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Parking"
          value={
            <input
              className="input mt-1"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={form.parkingCharges}
              onChange={(event) =>
                updateField("parkingCharges", event.target.value)
              }
            />
          }
        />
        <TripCard
          label="Extras"
          value={
            <input
              className="input mt-1"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={form.extraCharges}
              onChange={(event) =>
                updateField("extraCharges", event.target.value)
              }
            />
          }
        />
        <TripCard
          label={<>Vehicle Charges Per KM <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1 bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.perKmCharges}
                disabled
                readOnly
              />
              {errors.perKmCharges && <p className="text-xs text-red-600">{errors.perKmCharges}</p>}
            </div>
          }
        />
        <TripCard
          label="Trip Fare"
          value={
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {tripFare.toLocaleString()}
            </p>
          }
        />
        <TripCard
          label="Sub Total"
          value={
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {subTotal.toLocaleString()}
            </p>
          }
        />
        <TripCard
          label={<>GST (%) <span className="text-red-600">*</span></>}
          value={
            <div className="space-y-1">
              <input
                className="input mt-1"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={form.gstCharges}
                onChange={(event) =>
                  updateField("gstCharges", event.target.value)
                }
              />
              {errors.gstCharges && <p className="text-xs text-red-600">{errors.gstCharges}</p>}
            </div>
          }
        />
        <TripCard
          label="GST Amount"
          value={
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {gstAmount.toLocaleString()}
            </p>
          }
        />
        <TripCard
          label="Final Amount"
          value={
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {finalAmount.toLocaleString()}
            </p>
          }
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Generate Invoice
        </button>
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const normalized = status === "New" ? "New" : status === "Cancelled" ? "Cancelled" : status === "Completed" ? "Completed" : "Assigned";
  const className =
    normalized === "Completed" || normalized === "Assigned"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
      : normalized === "Cancelled"
        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}
    >
      {normalized}
    </span>
  );
}

function TripStatusBadge({ status }: { status: string }) {
  return <BookingStatusBadge status={status} />;
}

function TripCard({ label, value }: { label: React.ReactNode; value?: any }) {
  return (
    <div className="rounded-md border border-slate-200 p-2.5 dark:border-slate-800">
      <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-1 break-words text-[13px] text-slate-900 dark:text-white">
        {value ?? "-"}
      </div>
    </div>
  );
}

function TripDetails({ data }: { data: any }) {
  const booking = data.booking || data;
  const rows = [
    ["Booking ID", booking.bookingId || data.bookingId],
    ["Cab Request No", booking.cabRequestNumber],
    ["Business Unit", booking.businessUnit],
    ["Name of Passenger", booking.passengerName],
    ["Mobile", booking.mobileNumber],
    ["Travel Start Date", booking.travelStartDate],
    ["Travel End Date", booking.travelEndDate],
    ["Department Name", booking.departmentName],
    ["Reporting Address", booking.reportingAddress],
    ["Drop Address", booking.dropAddress],
    ["Car Type", booking.carType],
    ["Project Expenses", booking.projectExpenses],
    ["Cost Center Of Project", booking.costCenterOfProject],
    ["Booked By", booking.bookedBy],
    ["Purpose of Cab Booking", booking.purposeOfCabBooking],
    ["Employee Count", booking.employeeCount],
    ["Email", booking.senderEmail],
    ["Email Screenshot", booking.emailScreenshot ? <AttachmentLink href={booking.emailScreenshot} label="View Email Screenshot" /> : "-"],
    ["Trip Status", data.status || booking.status],
    ["Driver", data.driver?.driverName],
    [
      "Vehicle",
      data.vehicle
        ? `${data.vehicle.registration_number || data.vehicle.registrationNumber}${data.vehicle.vehicle_model || data.vehicle.vehicleModel ? ` - ${data.vehicle.vehicle_model || data.vehicle.vehicleModel}` : ""}`
        : undefined,
    ],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <TripCard key={label} label={String(label)} value={formatTripDetailValue(String(label), value)} />
      ))}
    </div>
  );
}

function DutySlipDetails({ data }: { data: any }) {
  const rows = [
    ["Duty Slip Number", data.dutySlipNumber],
    ["Booking ID", data.bookingId],
    ["Driver", data.driverId || data.driver?.driverName],
    ["Vehicle", data.vehicleId || data.vehicle?.registrationNumber || data.vehicle?.registration_number],
    ["KM OUT", data.kmOut],
    ["KM IN", data.kmIn],
    ["Total KM", data.totalKm],
    ["Time OUT", data.timeOut],
    ["Time IN", data.timeIn],
    ["Closing KM", data.closingKm],
    ["Closing Time", data.closingTime],
    ["Closing Location", data.closingLocation],
    ["Project Type", data.projectType],
    ["Billing Address", data.billingAddress],
    ["Toll Charges", data.tollCharges],
    ["Parking Charges", data.parkingCharges],
    ["Extra Charges", data.extraCharges],
    ["Rate Per KM", data.ratePerKm],
    ["Trip Fare", data.tripFare],
    ["Sub Total", data.subTotal],
    ["GST (%)", data.gstPercentage ?? data.gstCharges],
    ["GST Amount", data.gstAmount],
    ["Final Amount", data.finalAmount || data.amount],
    ["Status", data.status],
    ["Remarks", data.remarks],
    ["Invoice Status", data.invoice?.status],
    ["Invoice Number", data.invoice?.invoiceNumber],
    ["Invoice Amount", data.invoice?.amount],
    ["Duty Slip Photo", data.dutySlipPhoto ? <AttachmentLink href={data.dutySlipPhoto} label="View Duty Slip Photo" /> : "-"],
    ["Documents", Array.isArray(data.documents) && data.documents.length ? data.documents.map((doc: any) => <AttachmentLink key={doc.id || doc.filePath} href={doc.filePath} label={doc.originalName || "Document"} />) : "-"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <TripCard key={String(label)} label={String(label)} value={formatTripDetailValue(String(label), value)} />
      ))}
    </div>
  );
}

function formatTripDetailValue(label: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && isImagePreviewValue(label, value)) {
    return (
      <div className="space-y-2">
        <AttachmentLink href={value} label="Open image" />
        <img
          src={value}
          alt={label}
          className="max-h-40 w-full rounded-md border border-slate-200 object-contain dark:border-slate-800"
        />
      </div>
    );
  }
  return shouldFormatAsDate(label, value) ? formatDisplayDate(value) : value;
}

function isImagePreviewValue(label: string, value: string) {
  const normalizedLabel = label.toLowerCase();
  const imageExtensionPattern = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i;
  return (
    normalizedLabel.includes("photo") ||
    normalizedLabel.includes("screenshot") ||
    value.startsWith("data:image") ||
    imageExtensionPattern.test(value)
  );
}

function AttachmentLink({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-md border border-brand-100 px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-red-950/40 dark:text-brand-200 dark:hover:bg-red-950/20"
    >
      {label}
    </a>
  );
}

function buildAssignedTripFromBooking(booking: any, drivers: any[], vehicles: any[]) {
  const driverId = booking.assignedDriver || booking.assigned_driver;
  const vehicleId = booking.assignedVehicle || booking.assigned_vehicle;
  const driver = drivers.find((item) => String(item._id || item.id) === String(driverId));
  const vehicle = vehicles.find((item) => String(item._id || item.id) === String(vehicleId));

  return {
    ...booking,
    _id: booking._id,
    tripId: booking.tripId || booking.trip_id || booking._id,
    tripNumber: booking.tripNumber || booking.bookingId || booking.booking_id,
    bookingId: booking._id,
    driverId,
    vehicleId,
    driver,
    vehicle,
    booking,
    status: booking.status || "Assigned"
  };
}

function optionalNumber() {
  return z.preprocess(
    (value) =>
      value === "" || (typeof value === "number" && Number.isNaN(value))
        ? undefined
        : value,
    z.coerce.number().min(0, "Value cannot be negative.").optional(),
  );
}

function optionalMobileNumber() {
  return z.preprocess(
    (value) => value === null || value === undefined ? "" : value,
    z.string().trim().refine((value) => !value || /^\d{10}$/.test(value), "Mobile number must be 10 digits."),
  );
}

function buildDutySlipState(trip: any): DutySlipFormState {
  const hasCostCenter = Boolean(String(trip?.booking?.costCenterOfProject ?? "").trim());
  return {
    kmOut: String(trip?.kmOut ?? 0),
    kmIn: String(trip?.kmIn ?? 0),
    timeOut: trip?.timeOut ? toDatetimeLocal(trip.timeOut) : toDatetimeLocal(new Date()),
    timeIn: trip?.timeIn ? toDatetimeLocal(trip.timeIn) : toDatetimeLocal(new Date()),
    closingKm: "",
    closingTime: "",
    closingLocation: String(trip?.closingLocation ?? ""),
    dutySlipPhoto: String(trip?.dutySlipPhoto ?? ""),
    projectType: normalizeProjectType(
      trip?.projectType ?? (hasCostCenter ? "Management" : "Process"),
    ),
    billingAddress: String(
      trip?.billingAddress ?? trip?.booking?.reportingAddress ?? trip?.booking?.dropAddress ?? "",
    ),
    tollCharges: String(trip?.tollCharges ?? 0),
    parkingCharges: String(trip?.parkingCharges ?? 0),
    extraCharges: String(trip?.extraCharges ?? 0),
    gstCharges: String(trip?.gstCharges ?? 18),
    perKmCharges: String(trip?.perKmCharges ?? trip?.vehicle?.rate_per_km ?? trip?.vehicle?.ratePerKm ?? 0),
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
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function normalizeProjectType(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase() === "management"
    ? "Management"
    : "Process";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

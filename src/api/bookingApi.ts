import { apiRequest, unwrapData } from "./client";

export type BookingPayload = {
  bookingId?: string;
  booking_id?: string;
  cabRequestNumber?: string;
  cab_request_number?: string;
  businessUnit?: string;
  business_unit?: string;
  passengerName?: string;
  passenger_name?: string;
  mobileNumber?: string;
  mobile_number?: string;
  travelStartDate?: string;
  travel_start_date?: string;
  travelEndDate?: string;
  travel_end_date?: string;
  departmentName?: string;
  department_name?: string;
  reportingAddress?: string;
  reporting_address?: string;
  dropAddress?: string;
  drop_address?: string;
  carType?: string;
  car_type?: string;
  projectExpenses?: string;
  project_expenses?: string;
  costCenterOfProject?: string;
  cost_center_of_project?: string;
  bookedBy?: string;
  booked_by?: string;
  employeeCount?: number | string;
  employee_count?: number | string;
  purposeOfCabBooking?: string;
  purpose_of_cab_booking?: string;
  senderEmail?: string;
  sender_email?: string;
  status?: string;
};

export type DutySlipPayload = {
  bookingId?: string | number;
  driverId?: string | number;
  vehicleId?: string | number;
  kmOut?: number | string | null;
  kmIn?: number | string | null;
  timeOut?: string;
  timeIn?: string;
  closingKm?: number | string | null;
  closingTime?: string;
  closingLocation?: string;
  projectType?: string;
  billingAddress?: string;
  dutySlipPhoto?: string;
  tollCharges?: number | string | null;
  parkingCharges?: number | string | null;
  extraCharges?: number | string | null;
  ratePerKm?: number | string | null;
  gstCharges?: number | string | null;
  remarks?: string;
};

export const bookingApi = {
  async getBookings(filter: { status?: string } = {}) {
    return normalizeBookingList(unwrapData<any>(await apiRequest({ url: "/bookings", method: "GET", params: filter })));
  },

  async getBookingById(id: string) {
    return normalizeBooking(unwrapData<any>(await apiRequest({ url: `/bookings/${id}`, method: "GET" })));
  },

  async createBooking(payload: BookingPayload) {
    return normalizeBooking(unwrapData<any>(await apiRequest({ url: "/bookings", method: "POST", data: toBackendBookingPayload(payload) })));
  },

  async updateBooking(id: string, payload: Partial<BookingPayload>) {
    return normalizeBooking(unwrapData<any>(await apiRequest({ url: `/bookings/${id}`, method: "PUT", data: toBackendBookingPayload(payload) })));
  },

  async assignBooking(id: string, payload: { assigned_driver: string; assigned_vehicle: string; driver_status?: string; vehicle_status?: string }) {
    return normalizeBooking(unwrapData<any>(await apiRequest({ url: `/bookings/${id}/assign`, method: "PATCH", data: payload })));
  },

  async cancelBooking(id: string) {
    return normalizeBooking(unwrapData<any>(await apiRequest({ url: `/bookings/${id}/cancel`, method: "PATCH" })));
  },

  async scanMails() {
    return await apiRequest<any>({ url: "/bookings/scan-mails", method: "POST" });
  },

  async createDutySlip(payload: DutySlipPayload) {
    return normalizeDutySlip(unwrapData<any>(await apiRequest({ url: "/duty-slips", method: "POST", data: toBackendDutySlipPayload(payload) })));
  }
};

export function normalizeBookingList(value: any) {
  const rows = Array.isArray(value) ? value : value?.bookings || value?.items || value?.rows || [];
  return rows.map(normalizeBooking);
}

export function normalizeBooking(booking: any) {
  if (booking?.booking) return normalizeBooking(booking.booking);
  if (booking?.data && !booking.id && !booking._id && !booking.booking_id && !booking.bookingId) return normalizeBooking(booking.data);
  if (!booking) return booking;

  const id = String(booking._id || booking.id || booking.booking_id || booking.bookingId);
  return {
    ...booking,
    _id: id,
    id,
    bookingId: booking.bookingId || booking.booking_id || "",
    booking_id: booking.booking_id || booking.bookingId || "",
    cabRequestNumber: booking.cabRequestNumber || booking.cab_request_number || "",
    cab_request_number: booking.cab_request_number || booking.cabRequestNumber || "",
    businessUnit: booking.businessUnit || booking.business_unit || "",
    business_unit: booking.business_unit || booking.businessUnit || "",
    passengerName: booking.passengerName || booking.passenger_name || "",
    passenger_name: booking.passenger_name || booking.passengerName || "",
    mobileNumber: booking.mobileNumber || booking.mobile_number || "",
    mobile_number: booking.mobile_number || booking.mobileNumber || "",
    travelStartDate: booking.travelStartDate || booking.travel_start_date || "",
    travel_start_date: booking.travel_start_date || booking.travelStartDate || "",
    travelEndDate: booking.travelEndDate || booking.travel_end_date || "",
    travel_end_date: booking.travel_end_date || booking.travelEndDate || "",
    departmentName: booking.departmentName || booking.department_name || "",
    department_name: booking.department_name || booking.departmentName || "",
    reportingAddress: booking.reportingAddress || booking.reporting_address || "",
    reporting_address: booking.reporting_address || booking.reportingAddress || "",
    dropAddress: booking.dropAddress || booking.drop_address || "",
    drop_address: booking.drop_address || booking.dropAddress || "",
    carType: booking.carType || booking.car_type || "",
    car_type: booking.car_type || booking.carType || "",
    projectExpenses: booking.projectExpenses || booking.project_expenses || "No",
    project_expenses: booking.project_expenses || booking.projectExpenses || "No",
    costCenterOfProject: booking.costCenterOfProject || booking.cost_center_of_project || "",
    cost_center_of_project: booking.cost_center_of_project || booking.costCenterOfProject || "",
    bookedBy: booking.bookedBy || booking.booked_by || "",
    booked_by: booking.booked_by || booking.bookedBy || "",
    employeeCount: Number(booking.employeeCount ?? booking.employee_count ?? 0) || "",
    employee_count: Number(booking.employee_count ?? booking.employeeCount ?? 0) || "",
    purposeOfCabBooking: booking.purposeOfCabBooking || booking.purpose_of_cab_booking || "",
    purpose_of_cab_booking: booking.purpose_of_cab_booking || booking.purposeOfCabBooking || "",
    senderEmail: booking.senderEmail || booking.sender_email || "",
    sender_email: booking.sender_email || booking.senderEmail || "",
    emailScreenshot: booking.emailScreenshot || booking.email_screenshot || "",
    email_screenshot: booking.email_screenshot || booking.emailScreenshot || null,
    status: booking.status || "New",
    assignedDriver: booking.assignedDriver || booking.assigned_driver || null,
    assigned_driver: booking.assigned_driver || booking.assignedDriver || null,
    assignedVehicle: booking.assignedVehicle || booking.assigned_vehicle || null,
    assigned_vehicle: booking.assigned_vehicle || booking.assignedVehicle || null,
    createdAt: booking.createdAt || booking.created_at,
    created_at: booking.created_at || booking.createdAt,
    updatedAt: booking.updatedAt || booking.updated_at,
    updated_at: booking.updated_at || booking.updatedAt
  };
}

function normalizeDutySlip(value: any) {
  if (!value) return value;
  return {
    ...value,
    _id: String(value._id || value.id),
    id: value.id || value._id,
    invoice: value.invoice
  };
}

function toBackendBookingPayload(payload: BookingPayload) {
  const backendPayload: Record<string, unknown> = {};
  assignIfPresent(backendPayload, "cab_request_number", payload.cab_request_number ?? payload.cabRequestNumber);
  assignIfPresent(backendPayload, "business_unit", payload.business_unit ?? payload.businessUnit);
  assignIfPresent(backendPayload, "passenger_name", payload.passenger_name ?? payload.passengerName);
  assignIfPresent(backendPayload, "mobile_number", payload.mobile_number ?? payload.mobileNumber);
  assignIfPresent(backendPayload, "travel_start_date", toIsoDate(payload.travel_start_date ?? payload.travelStartDate));
  assignIfPresent(backendPayload, "travel_end_date", toIsoDate(payload.travel_end_date ?? payload.travelEndDate));
  assignIfPresent(backendPayload, "department_name", payload.department_name ?? payload.departmentName);
  assignIfPresent(backendPayload, "reporting_address", payload.reporting_address ?? payload.reportingAddress);
  assignIfPresent(backendPayload, "drop_address", payload.drop_address ?? payload.dropAddress);
  assignIfPresent(backendPayload, "car_type", payload.car_type ?? payload.carType);
  assignIfPresent(backendPayload, "project_expenses", payload.project_expenses ?? payload.projectExpenses);
  assignIfPresent(backendPayload, "cost_center_of_project", payload.cost_center_of_project ?? payload.costCenterOfProject);
  assignIfPresent(backendPayload, "booked_by", payload.booked_by ?? payload.bookedBy);
  assignIfPresent(backendPayload, "employee_count", payload.employee_count ?? payload.employeeCount, true);
  assignIfPresent(backendPayload, "purpose_of_cab_booking", payload.purpose_of_cab_booking ?? payload.purposeOfCabBooking);
  assignIfPresent(backendPayload, "sender_email", payload.sender_email ?? payload.senderEmail);
  assignIfPresent(backendPayload, "status", payload.status || "New");
  return backendPayload;
}

function toBackendDutySlipPayload(payload: DutySlipPayload) {
  const backendPayload: Record<string, unknown> = {};
  assignIfPresent(backendPayload, "bookingId", payload.bookingId);
  assignIfPresent(backendPayload, "driverId", payload.driverId);
  assignIfPresent(backendPayload, "vehicleId", payload.vehicleId);
  assignIfPresent(backendPayload, "kmOut", payload.kmOut, true);
  assignIfPresent(backendPayload, "kmIn", payload.kmIn, true);
  assignIfPresent(backendPayload, "timeOut", payload.timeOut);
  assignIfPresent(backendPayload, "timeIn", payload.timeIn);
  assignIfPresent(backendPayload, "closingKm", payload.closingKm, true);
  assignIfPresent(backendPayload, "closingTime", payload.closingTime);
  assignIfPresent(backendPayload, "closingLocation", payload.closingLocation);
  assignIfPresent(backendPayload, "projectType", payload.projectType);
  assignIfPresent(backendPayload, "billingAddress", payload.billingAddress);
  assignIfPresent(backendPayload, "dutySlipPhoto", payload.dutySlipPhoto);
  assignIfPresent(backendPayload, "tollCharges", payload.tollCharges, true);
  assignIfPresent(backendPayload, "parkingCharges", payload.parkingCharges, true);
  assignIfPresent(backendPayload, "extraCharges", payload.extraCharges, true);
  assignIfPresent(backendPayload, "ratePerKm", payload.ratePerKm, true);
  assignIfPresent(backendPayload, "gstCharges", payload.gstCharges, true);
  assignIfPresent(backendPayload, "remarks", payload.remarks);
  return backendPayload;
}

function assignIfPresent(target: Record<string, unknown>, key: string, value: unknown, numeric = false) {
  if (value === undefined || value === null || value === "") return;
  target[key] = numeric ? Number(value) : value;
}

function toIsoDate(value: unknown) {
  if (value === undefined || value === null || value === "") return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

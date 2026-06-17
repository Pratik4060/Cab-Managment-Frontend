import { apiClient, apiRequest, unwrapData } from "./client";

export type InvoiceUpdatePayload = {
  projectType?: string;
  billingAddress?: string;
  tripFare?: number | string | null;
  totalKm?: number | string | null;
  kmOut?: number | string | null;
  kmIn?: number | string | null;
  timeOut?: string;
  timeIn?: string;
  tollCharges?: number | string | null;
  parkingCharges?: number | string | null;
  extraCharges?: number | string | null;
  gstPercent?: number | string | null;
  gstCharges?: number | string | null;
  gstAmount?: number | string | null;
  finalAmount?: number | string | null;
  remainingAmount?: number | string | null;
  balanceAmount?: number | string | null;
};

export type InvoicePaymentPayload = {
  paymentStatus: string;
  paymentType?: string;
  addAmount?: number | string | null;
  remark?: string;
};

export type InvoiceCreatePayload = {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  projectType: string;
  billingAddress: string;
  tripFare: number | string;
  totalKm: number | string;
  kmOut: number | string;
  kmIn: number | string;
  tollCharges: number | string;
  parkingCharges: number | string;
  extraCharges: number | string;
  gstPercent: number | string;
};

export type BulkSendPayload = {
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  search?: string;
  emailSubject: string;
  emailBody: string;
};

export const invoiceApi = {
  async getInvoices(params: Record<string, any> = {}) {
    return normalizeInvoiceList(
      unwrapData<any>(
        await apiRequest({ url: "/invoices", method: "GET", params }),
      ),
    );
  },

  async getInvoiceById(id: string) {
    return normalizeInvoice(
      unwrapData<any>(
        await apiRequest({ url: `/invoices/${id}`, method: "GET" }),
      ),
    );
  },

  async createInvoice(payload: InvoiceCreatePayload) {
    return normalizeInvoice(
      unwrapData<any>(
        await apiRequest({
          url: "/invoices",
          method: "POST",
          data: toInvoiceCreatePayload(payload),
        }),
      ),
    );
  },

  async updateInvoice(id: string, payload: InvoiceUpdatePayload) {
    return normalizeInvoice(
      unwrapData<any>(
        await apiRequest({
          url: `/invoices/${id}`,
          method: "PUT",
          data: toInvoiceUpdatePayload(payload),
        }),
      ),
    );
  },

  async updatePaymentStatus(id: string, payload: InvoicePaymentPayload) {
    return normalizeInvoice(
      unwrapData<any>(
        await apiRequest({
          url: `/invoices/${id}/payment-status`,
          method: "PATCH",
          data: toPaymentPayload(payload),
        }),
      ),
    );
  },

  async sendInvoice(id: string, payload: { clientEmail: string }) {
    const data = unwrapData<any>(
      await apiRequest({
        url: `/invoices/${id}/send`,
        method: "POST",
        data: payload,
      }),
    );
    return data?.id || data?._id || data?.invoiceNumber ? normalizeInvoice(data) : null;
  },

  async sendBulk(payload: BulkSendPayload) {
    return await apiRequest<any>({
      url: "/invoices/send-bulk",
      method: "POST",
      data: payload,
    });
  },

  async deleteInvoice(id: string) {
    await apiRequest({ url: `/invoices/${id}`, method: "DELETE" });
    return id;
  },

  async downloadPdf(id: string) {
    const response = await apiClient.request<Blob>({
      url: `/invoices/${id}/pdf`,
      method: "GET",
      responseType: "blob",
    });
    return response.data;
  },
};

export function normalizeInvoiceList(value: any) {
  const rows = Array.isArray(value)
    ? value
    : value?.invoices || value?.items || value?.rows || [];
  return rows.map(normalizeInvoice);
}

export function normalizeInvoice(invoice: any) {
  if (invoice?.invoice) return normalizeInvoice(invoice.invoice);
  if (
    invoice?.data &&
    !invoice.id &&
    !invoice._id &&
    !invoice.invoiceNumber &&
    !invoice.invoice_number
  )
    return normalizeInvoice(invoice.data);
  if (!invoice) return invoice;

  const id = String(invoice._id || invoice.id);
  const trip = invoice.trip || {};
  const booking = invoice.booking || {};
  const remainingAmount = Number(
    invoice.remainingAmount ??
      invoice.remaining_amount ??
      invoice.balanceAmount ??
      invoice.balance_amount ??
      0,
  );

  return {
    ...invoice,
    _id: id,
    id,
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || "",
    invoiceDate: invoice.invoiceDate || invoice.invoice_date || "",
    tripId: invoice.tripId || invoice.trip_id,
    bookingId: invoice.bookingId || invoice.booking_id,
    clientName:
      invoice.clientName ||
      invoice.client_name ||
      invoice.passengerName ||
      invoice.passenger_name ||
      booking.passengerName ||
      booking.passenger_name ||
      "",
    clientEmail:
      invoice.clientEmail ||
      invoice.client_email ||
      booking.senderEmail ||
      booking.sender_email ||
      "",
    projectType:
      invoice.projectType ||
      invoice.project_type ||
      trip.projectType ||
      trip.project_type ||
      "Process",
    billingAddress:
      invoice.billingAddress ||
      invoice.billing_address ||
      trip.billingAddress ||
      trip.billing_address ||
      booking.reportingAddress ||
      booking.reporting_address ||
      "",
    tripFare: Number(invoice.tripFare ?? invoice.trip_fare ?? 0),
    totalKm: Number(
      invoice.totalKm ?? invoice.total_km ?? trip.totalKm ?? trip.total_km ?? 0,
    ),
    kmOut: invoice.kmOut ?? invoice.km_out ?? trip.kmOut ?? trip.km_out,
    kmIn: invoice.kmIn ?? invoice.km_in ?? trip.kmIn ?? trip.km_in,
    timeOut:
      invoice.timeOut || invoice.time_out || trip.timeOut || trip.time_out,
    timeIn: invoice.timeIn || invoice.time_in || trip.timeIn || trip.time_in,
    tollCharges: Number(
      invoice.tollCharges ??
        invoice.toll_charges ??
        trip.tollCharges ??
        trip.toll_charges ??
        0,
    ),
    parkingCharges: Number(
      invoice.parkingCharges ??
        invoice.parking_charges ??
        trip.parkingCharges ??
        trip.parking_charges ??
        0,
    ),
    extraCharges: Number(
      invoice.extraCharges ??
        invoice.extra_charges ??
        trip.extraCharges ??
        trip.extra_charges ??
        0,
    ),
    gstPercent: Number(
      invoice.gstPercent ??
        invoice.gst_percent ??
        invoice.gstPercentage ??
        invoice.gst_percentage ??
        trip.gstCharges ??
        trip.gst_charges ??
        0,
    ),
    gstAmount: Number(invoice.gstAmount ?? invoice.gst_amount ?? 0),
    subtotal: Number(
      invoice.subtotal ?? invoice.subTotal ?? invoice.sub_total ?? 0,
    ),
    finalAmount: Number(invoice.finalAmount ?? invoice.final_amount ?? 0),
    paidAmount: Number(invoice.paidAmount ?? invoice.paid_amount ?? 0),
    remainingAmount,
    balanceAmount: Number(
      invoice.balanceAmount ?? invoice.balance_amount ?? remainingAmount,
    ),
    status: invoice.status || "Draft",
    paymentStatus:
      invoice.paymentStatus ||
      invoice.payment_status ||
      (remainingAmount === 0 ? "Paid" : "Pending"),
    paymentType: invoice.paymentType || invoice.payment_type || "",
    paymentRemark: invoice.paymentRemark || invoice.payment_remark || "",
    passengerName:
      invoice.passengerName ||
      invoice.passenger_name ||
      booking.passengerName ||
      booking.passenger_name,
    businessUnit:
      invoice.businessUnit ||
      invoice.business_unit ||
      booking.businessUnit ||
      booking.business_unit,
    cabRequestNumber:
      invoice.cabRequestNumber ||
      invoice.cab_request_number ||
      booking.cabRequestNumber ||
      booking.cab_request_number,
    emailScreenshot:
      invoice.emailScreenshot ||
      invoice.email_screenshot ||
      booking.emailScreenshot ||
      booking.email_screenshot,
    createdAt: invoice.createdAt || invoice.created_at,
    updatedAt: invoice.updatedAt || invoice.updated_at,
    trip: {
      ...trip,
      kmOut: trip.kmOut ?? trip.km_out ?? invoice.kmOut ?? invoice.km_out,
      kmIn: trip.kmIn ?? trip.km_in ?? invoice.kmIn ?? invoice.km_in,
      totalKm:
        trip.totalKm ?? trip.total_km ?? invoice.totalKm ?? invoice.total_km,
      timeOut:
        trip.timeOut || trip.time_out || invoice.timeOut || invoice.time_out,
      timeIn: trip.timeIn || trip.time_in || invoice.timeIn || invoice.time_in,
      tollCharges:
        trip.tollCharges ??
        trip.toll_charges ??
        invoice.tollCharges ??
        invoice.toll_charges,
      parkingCharges:
        trip.parkingCharges ??
        trip.parking_charges ??
        invoice.parkingCharges ??
        invoice.parking_charges,
      extraCharges:
        trip.extraCharges ??
        trip.extra_charges ??
        invoice.extraCharges ??
        invoice.extra_charges,
      gstCharges:
        trip.gstCharges ??
        trip.gst_charges ??
        invoice.gstPercent ??
        invoice.gst_percent,
    },
    booking: {
      ...booking,
      bookingId:
        booking.bookingId ||
        booking.booking_id ||
        invoice.bookingId ||
        invoice.booking_id,
      passengerName:
        booking.passengerName ||
        booking.passenger_name ||
        invoice.passengerName ||
        invoice.passenger_name,
      businessUnit:
        booking.businessUnit ||
        booking.business_unit ||
        invoice.businessUnit ||
        invoice.business_unit,
      cabRequestNumber:
        booking.cabRequestNumber ||
        booking.cab_request_number ||
        invoice.cabRequestNumber ||
        invoice.cab_request_number,
      reportingAddress:
        booking.reportingAddress ||
        booking.reporting_address ||
        invoice.reportingAddress ||
        invoice.reporting_address,
      dropAddress:
        booking.dropAddress ||
        booking.drop_address ||
        invoice.dropAddress ||
        invoice.drop_address,
      senderEmail:
        booking.senderEmail ||
        booking.sender_email ||
        invoice.clientEmail ||
        invoice.client_email,
      emailScreenshot:
        booking.emailScreenshot ||
        booking.email_screenshot ||
        invoice.emailScreenshot ||
        invoice.email_screenshot,
    },
  };
}

function toInvoiceUpdatePayload(payload: any) {
  const result: Record<string, unknown> = {};
  assignIfPresent(result, "kmOut", payload.kmOut, true);
  assignIfPresent(result, "kmIn", payload.kmIn, true);
  assignIfPresent(result, "timeOut", toIsoDate(payload.timeOut));
  assignIfPresent(result, "timeIn", toIsoDate(payload.timeIn));
  assignIfPresent(result, "projectType", payload.projectType);
  assignIfPresent(result, "billingAddress", payload.billingAddress);
  assignIfPresent(result, "tripFare", payload.tripFare, true);
  assignIfPresent(result, "totalKm", payload.totalKm, true);
  assignIfPresent(result, "tollCharges", payload.tollCharges, true);
  assignIfPresent(result, "parkingCharges", payload.parkingCharges, true);
  assignIfPresent(result, "extraCharges", payload.extraCharges, true);
  assignIfPresent(
    result,
    "gstCharges",
    payload.gstCharges ?? payload.gstPercent,
    true,
  );
  assignIfPresent(result, "gstAmount", payload.gstAmount, true);
  assignIfPresent(result, "finalAmount", payload.finalAmount, true);
  assignIfPresent(result, "remainingAmount", payload.remainingAmount, true);
  assignIfPresent(result, "balanceAmount", payload.balanceAmount, true);
  return result;
}

function toInvoiceCreatePayload(payload: InvoiceCreatePayload) {
  return {
    bookingId: payload.bookingId,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectType: payload.projectType,
    billingAddress: payload.billingAddress,
    tripFare: Number(payload.tripFare),
    totalKm: Number(payload.totalKm),
    kmOut: Number(payload.kmOut),
    kmIn: Number(payload.kmIn),
    tollCharges: Number(payload.tollCharges),
    parkingCharges: Number(payload.parkingCharges),
    extraCharges: Number(payload.extraCharges),
    gstPercent: Number(payload.gstPercent)
  };
}

function toPaymentPayload(payload: InvoicePaymentPayload) {
  const result: Record<string, unknown> = {};
  assignIfPresent(result, "paymentStatus", payload.paymentStatus);
  assignIfPresent(result, "paymentType", payload.paymentType);
  assignIfPresent(result, "addAmount", payload.addAmount, true);
  assignIfPresent(result, "remark", payload.remark);
  return result;
}

function assignIfPresent(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
  numeric = false,
) {
  if (value === undefined || value === null || value === "") return;
  target[key] = numeric ? Number(value) : value;
}

function toIsoDate(value: unknown) {
  if (!value) return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

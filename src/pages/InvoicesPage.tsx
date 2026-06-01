import { Banknote, Download, Eye, FileDown, Mail, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { invoiceActions, sendInvoice } from "../redux/slices/invoiceSlice";
import { downloadFile } from "../utils/downloadFile";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partial" | "Pending";
type InvoicePaymentStatus = "Paid" | "Partial" | "Pending";

type InvoiceDutySlipState = {
  kmOut: string;
  kmIn: string;
  timeOut: string;
  timeIn: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstCharges: string;
};

type InvoicePaymentState = {
  paymentStatus: InvoicePaymentStatus;
  addAmount: string;
  remark: string;
};

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilters, setDateFilters] = useState({ from: "", to: "" });
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const invoices = useAppSelector((s) => s.invoices);

  useEffect(() => {
    dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
  }, [dispatch, statusFilter]);

  const rows = useMemo(() => {
    return (invoices.items || []).filter((invoice) => {
      if (!dateFilters.from && !dateFilters.to) return true;
      const createdAt = invoice.createdAt ? new Date(invoice.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
      if (dateFilters.from && createdAt < new Date(dateFilters.from)) return false;
      if (dateFilters.to && createdAt > new Date(`${dateFilters.to}T23:59:59`)) return false;
      return true;
    });
  }, [dateFilters.from, dateFilters.to, invoices.items]);
  const selectedInvoices = rows.filter((invoice) => selectedInvoiceIds.includes(String(invoice._id)));
  const exportQuery = new URLSearchParams({
    ...(dateFilters.from ? { from: dateFilters.from } : {}),
    ...(dateFilters.to ? { to: dateFilters.to } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(selectedInvoiceIds.length ? { selected: selectedInvoiceIds.join(",") } : {})
  }).toString();

  useEffect(() => {
    const visibleIds = new Set(rows.map((invoice) => String(invoice._id)));
    setSelectedInvoiceIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [rows]);

  function toggleInvoiceSelection(id: string) {
    setSelectedInvoiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function exportInvoices(format: "xlsx" | "pdf") {
    const exportRows = selectedInvoices.length ? selectedInvoices : rows;
    downloadFile(
      `/reports/invoices/export.${format}${exportQuery ? `?${exportQuery}` : ""}`,
      `invoices.${format}`,
      buildInvoiceExport(exportRows)
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-slate-500">Preview, export PDF, email, and manage duty slip billing details.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select className="input w-32" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <input className="input w-36" type="date" value={dateFilters.from} onChange={(event) => setDateFilters((filters) => ({ ...filters, from: event.target.value }))} aria-label="Invoice from date" />
          <input className="input w-36" type="date" value={dateFilters.to} onChange={(event) => setDateFilters((filters) => ({ ...filters, to: event.target.value }))} aria-label="Invoice to date" />
          <button className="btn-secondary" onClick={() => exportInvoices("xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </button>
          {/* <button className="btn-secondary" onClick={() => exportInvoices("pdf")}>
            <Download className="h-4 w-4" />
            PDF

          </button> */}
          <button
            className="btn-secondary"
          // onClick={() => exportInvoices("pdf")}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>
      </div>

      <div className="panel p-2">
        <DataTable
          loading={invoices.loading}
          rows={rows}
          selectable
          selectedIds={selectedInvoiceIds}
          onToggleRow={toggleInvoiceSelection}
          onToggleAll={setSelectedInvoiceIds}
          columns={[
            { key: "invoiceNumber", header: "Invoice" },
            { key: "clientName", header: "Client" },
            { key: "status", header: "Invoice Status", render: (r) => <InvoiceStatusBadge status={r.status} /> },
            { key: "paymentStatus", header: "Payment Status", render: (r) => <PaymentStatusBadge invoice={r} /> },
            { key: "finalAmount", header: "Total", render: (r) => `₹ ${Number(r.finalAmount || 0).toLocaleString()}` },
            { key: "remainingAmount", header: "Balance", render: (r) => `₹ ${Number(remainingAmount(r)).toLocaleString()}` }
          ]}
          actionCount={5}
          actions={(row) => (
            <div className="flex min-w-36 flex-col gap-1.5">
              <button className="btn-secondary w-full justify-start p-2" title="Preview invoice" onClick={() => setPreviewInvoice(row)}>
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2" title="Edit invoice" onClick={() => setEditTarget(row)}>
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2" title="Update payment status" onClick={() => setPaymentTarget(row)}>
                <Banknote className="h-4 w-4" />
                <span>Payment Status</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2" title="Send invoice to client" onClick={() => setSendTarget(row)}>
                <Mail className="h-4 w-4" />
                <span>Send</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2" title="Download PDF" onClick={() => downloadFile(`/invoices/${row._id}/pdf`, `${row.invoiceNumber}.pdf`)}>
                <FileDown className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          )}
        />
      </div>

      <Modal open={Boolean(previewInvoice)} title={`Invoice Preview ${previewInvoice?.invoiceNumber || ""}`} onClose={() => setPreviewInvoice(null)}>
        {previewInvoice && <InvoicePreview invoice={previewInvoice} />}
      </Modal>

      <Modal open={Boolean(editTarget)} title={`Edit Invoice ${editTarget?.invoiceNumber || ""}`} onClose={() => setEditTarget(null)}>
        {editTarget && (
          <InvoiceDutySlipEditor
            invoice={editTarget}
            onSubmit={async (payload) => {
              await dispatch(invoiceActions.updateOne({ id: editTarget._id, payload }));
              setEditTarget(null);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(paymentTarget)} title={`Payment Status ${paymentTarget?.invoiceNumber || ""}`} onClose={() => setPaymentTarget(null)}>
        {paymentTarget && (
          <InvoicePaymentStatusEditor
            invoice={paymentTarget}
            onSubmit={async (payload) => {
              await dispatch(invoiceActions.updateOne({ id: paymentTarget._id, payload }));
              setPaymentTarget(null);
            }}
          />
        )}
      </Modal>

      <Modal open={Boolean(sendTarget)} title={`Send Invoice ${sendTarget?.invoiceNumber || ""}`} onClose={() => setSendTarget(null)}>
        <EntityForm
          fields={[{ name: "clientEmail", label: "Client Email", type: "email", full: true }]}
          defaults={{ clientEmail: sendTarget?.clientEmail || sendTarget?.booking?.senderEmail || "" }}
          schema={z.object({ clientEmail: z.string().email("Valid client email is required") })}
          submitLabel="Send Invoice"
          onSubmit={async (values) => {
            await dispatch(sendInvoice({ id: sendTarget._id, payload: values }));
            await dispatch(invoiceActions.fetchAll(undefined));
            setSendTarget(null);
          }}
        />
      </Modal>
    </div>
  );
}

function InvoiceDutySlipEditor({ invoice, onSubmit }: { invoice: any; onSubmit: (payload: any) => Promise<void> | void }) {
  const [form, setForm] = useState<InvoiceDutySlipState>(() => invoiceDutySlipDefaults(invoice));

  useEffect(() => {
    setForm(invoiceDutySlipDefaults(invoice));
  }, [invoice]);

  const computed = useMemo(() => calculateInvoiceTotals(invoice, form), [invoice, form]);

  function updateField(field: keyof InvoiceDutySlipState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    const payload = buildInvoiceUpdatePayload(invoice, form);
    await onSubmit(payload);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Invoice" value={invoice.invoiceNumber} />
        <InfoCard label="Client" value={invoice.clientName || invoice.booking?.businessUnit || "-"} />
        <InfoCard label="Passenger" value={invoice.booking?.passengerName || "-"} />
        <InfoCard label="Trip" value={invoice.trip?.tripNumber || "-"} />
        <InfoCard label="KM OUT" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmOut} onChange={(event) => updateField("kmOut", event.target.value)} />} />
        <InfoCard label="KM IN" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmIn} onChange={(event) => updateField("kmIn", event.target.value)} />} />
        <InfoCard label="Time OUT" value={<input className="input mt-1" type="datetime-local" value={form.timeOut} onChange={(event) => updateField("timeOut", event.target.value)} />} />
        <InfoCard label="Time IN" value={<input className="input mt-1" type="datetime-local" value={form.timeIn} onChange={(event) => updateField("timeIn", event.target.value)} />} />
        <InfoCard label="Toll Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.tollCharges} onChange={(event) => updateField("tollCharges", event.target.value)} />} />
        <InfoCard label="Parking Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.parkingCharges} onChange={(event) => updateField("parkingCharges", event.target.value)} />} />
        <InfoCard label="Extra Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.extraCharges} onChange={(event) => updateField("extraCharges", event.target.value)} />} />
        <InfoCard label="GST (%)" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.gstCharges} onChange={(event) => updateField("gstCharges", event.target.value)} />} />
        <InfoCard label="Payment Status" value={<PaymentStatusBadge invoice={buildPreviewInvoice(invoice, form)} />} />
        <InfoCard label="Balance" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.remainingAmount.toLocaleString()}</p>} />
        <InfoCard label="Total KM" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{computed.totalKm.toLocaleString()}</p>} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setForm(invoiceDutySlipDefaults(invoice))}>Reset</button>
        <button type="button" className="btn-primary" onClick={submit}>Update Invoice</button>
      </div>
    </div>
  );
}

function InvoicePaymentStatusEditor({ invoice, onSubmit }: { invoice: any; onSubmit: (payload: any) => Promise<void> | void }) {
  const [form, setForm] = useState<InvoicePaymentState>(() => invoicePaymentDefaults(invoice));

  useEffect(() => {
    setForm(invoicePaymentDefaults(invoice));
  }, [invoice]);

  const computed = useMemo(() => calculatePaymentTotals(invoice, form), [invoice, form]);

  function updateField(field: keyof InvoicePaymentState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    await onSubmit(buildPaymentUpdatePayload(invoice, form));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Invoice" value={invoice.invoiceNumber} />
        <InfoCard label="Client" value={invoice.clientName || invoice.booking?.businessUnit || "-"} />
        <InfoCard label="Current Payment Status" value={<PaymentStatusBadge invoice={invoice} />} />
        <InfoCard label="Payment Status" value={<select className="input mt-1" value={form.paymentStatus} onChange={(event) => updateField("paymentStatus", event.target.value as InvoicePaymentStatus)}>{["Pending", "Partial", "Paid"].map((status) => <option key={status} value={status}>{status}</option>)}</select>} />
        {form.paymentStatus === "Partial" && (
          <InfoCard label="Add Amount" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.addAmount} onChange={(event) => updateField("addAmount", event.target.value)} />} />
        )}
        {(form.paymentStatus === "Pending" || form.paymentStatus === "Partial") && (
          <InfoCard label="Remark" value={<textarea className="input mt-1 min-h-24" value={form.remark} onChange={(event) => updateField("remark", event.target.value)} />} />
        )}
        <InfoCard label="Balance" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.remainingAmount.toLocaleString()}</p>} />
        <InfoCard label="Paid Amount" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.paidAmount.toLocaleString()}</p>} />
        <InfoCard label="Final Amount" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {Number(invoice.finalAmount || 0).toLocaleString()}</p>} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setForm(invoicePaymentDefaults(invoice))}>Reset</button>
        <button type="button" className="btn-primary" onClick={submit}>Update Payment Status</button>
      </div>
    </div>
  );
}

function buildInvoiceUpdatePayload(invoice: any, form: InvoiceDutySlipState) {
  const computed = calculateInvoiceTotals(invoice, form);
  return {
    tripFare: computed.tripFare,
    kmOut: computed.kmOut,
    kmIn: computed.kmIn,
    totalKm: computed.totalKm,
    timeOut: form.timeOut || undefined,
    timeIn: form.timeIn || undefined,
    tollCharges: computed.tollCharges,
    parkingCharges: computed.parkingCharges,
    extraCharges: computed.extraCharges,
    gstPercent: computed.gstPercent,
    gstAmount: computed.gstAmount,
    finalAmount: computed.finalAmount,
    remainingAmount: computed.remainingAmount,
    balanceAmount: computed.remainingAmount,
    trip: {
      ...(invoice.trip || {}),
      kmOut: computed.kmOut,
      kmIn: computed.kmIn,
      totalKm: computed.totalKm,
      timeOut: form.timeOut || undefined,
      timeIn: form.timeIn || undefined,
      tollCharges: computed.tollCharges,
      parkingCharges: computed.parkingCharges,
      extraCharges: computed.extraCharges,
      gstCharges: computed.gstPercent
    }
  };
}

function buildPaymentUpdatePayload(invoice: any, form: InvoicePaymentState) {
  const computed = calculatePaymentTotals(invoice, form);
  return {
    paymentStatus: computed.paymentStatus,
    paidAmount: computed.paidAmount,
    remainingAmount: computed.remainingAmount,
    balanceAmount: computed.remainingAmount,
    paymentRemark: form.remark.trim() || undefined
  };
}

function calculateInvoiceTotals(invoice: any, form: InvoiceDutySlipState) {
  const kmOut = normalizeNumber(form.kmOut);
  const kmIn = normalizeNumber(form.kmIn);
  const totalKm = kmOut !== null && kmIn !== null && kmIn >= kmOut ? kmIn - kmOut : Number(invoice.trip?.totalKm || 0);
  const ratePerKm = Number(invoice.trip?.vehicle?.ratePerKm || invoice.tripFare / Math.max(1, Number(invoice.trip?.totalKm || 1)) || 22);
  const tripFare = Math.round(totalKm * ratePerKm);
  const tollCharges = normalizeNumber(form.tollCharges) ?? Number(invoice.trip?.tollCharges || 0);
  const parkingCharges = normalizeNumber(form.parkingCharges) ?? Number(invoice.trip?.parkingCharges || 0);
  const extraCharges = normalizeNumber(form.extraCharges) ?? Number(invoice.trip?.extraCharges || 0);
  const gstPercent = normalizeNumber(form.gstCharges) ?? 5;
  const subtotal = tripFare + tollCharges + parkingCharges + extraCharges;
  const gstAmount = Math.round(subtotal * (gstPercent / 100));
  const finalAmount = subtotal + gstAmount;
  const existingPaid = Number(invoice.paidAmount || 0);
  const remainingAmount = Math.max(0, finalAmount - existingPaid);

  return { kmOut, kmIn, totalKm, ratePerKm, tripFare, tollCharges, parkingCharges, extraCharges, gstPercent, gstAmount, subtotal, finalAmount, remainingAmount };
}

function calculatePaymentTotals(invoice: any, form: InvoicePaymentState) {
  const finalAmount = Number(invoice.finalAmount || 0);
  const existingPaid = Number(invoice.paidAmount || 0);
  const addAmount = form.paymentStatus === "Partial" ? Math.max(0, normalizeNumber(form.addAmount) || 0) : 0;
  const paidAmount = form.paymentStatus === "Paid"
    ? finalAmount
    : form.paymentStatus === "Partial"
      ? Math.min(finalAmount, existingPaid + addAmount)
      : existingPaid;
  const remainingAmount = Math.max(0, finalAmount - paidAmount);

  return {
    paymentStatus: remainingAmount === 0 ? "Paid" : form.paymentStatus,
    paidAmount,
    remainingAmount
  } satisfies { paymentStatus: InvoicePaymentStatus; paidAmount: number; remainingAmount: number };
}

function buildPreviewInvoice(invoice: any, form: InvoiceDutySlipState) {
  const computed = calculateInvoiceTotals(invoice, form);
  return {
    ...invoice,
    finalAmount: computed.finalAmount,
    remainingAmount: computed.remainingAmount,
    balanceAmount: computed.remainingAmount
  };
}

function invoicePaymentDefaults(invoice: any): InvoicePaymentState {
  const currentStatus = invoice.paymentStatus || (Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0) === 0
    ? "Paid"
    : Number(invoice.paidAmount || 0) > 0
      ? "Partial"
      : "Pending");

  return {
    paymentStatus: currentStatus === "Paid" || currentStatus === "Partial" ? currentStatus : "Pending",
    addAmount: "",
    remark: String(invoice.paymentRemark || invoice.paymentRemarks || "")
  };
}

function invoiceDutySlipDefaults(invoice: any): InvoiceDutySlipState {
  return {
    kmOut: invoice.trip?.kmOut === undefined || invoice.trip?.kmOut === null ? "" : String(invoice.trip.kmOut),
    kmIn: invoice.trip?.kmIn === undefined || invoice.trip?.kmIn === null ? "" : String(invoice.trip.kmIn),
    timeOut: invoice.trip?.timeOut ? toDatetimeLocal(invoice.trip.timeOut) : "",
    timeIn: invoice.trip?.timeIn ? toDatetimeLocal(invoice.trip.timeIn) : "",
    tollCharges: String(invoice.trip?.tollCharges ?? 0),
    parkingCharges: String(invoice.trip?.parkingCharges ?? 0),
    extraCharges: String(invoice.trip?.extraCharges ?? 0),
    gstCharges: String(invoice.trip?.gstCharges ?? invoice.gstPercent ?? 5)
  };
}

function remainingAmount(invoice: any) {
  return Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0);
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    Sent: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-100",
    Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    Partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    Pending: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status] || styles.Draft}`}>{status}</span>;
}

function PaymentStatusBadge({ invoice }: { invoice: any }) {
  const amount = remainingAmount(invoice);
  const status = invoice.paymentStatus || (amount === 0 ? "Paid" : Number(invoice.paidAmount || 0) > 0 || invoice.status === "Partial" ? "Partial" : "Pending");
  const styles: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    Partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

function InvoicePreview({ invoice }: { invoice: any }) {
  const rows = [
    ["Invoice Number", invoice.invoiceNumber],
    ["Client", invoice.clientName || invoice.booking?.businessUnit || "-"],
    ["Passenger", invoice.booking?.passengerName || "-"],
    ["Booking ID", invoice.booking?.bookingId || "-"],
    ["Trip", invoice.trip?.tripNumber || "-"],
    ["Total KM", invoice.trip?.totalKm || 0],
    ["Trip Fare", `₹ ${Number(invoice.tripFare || 0).toLocaleString()}`],
    ["Toll Charges", `₹ ${Number(invoice.trip?.tollCharges || 0).toLocaleString()}`],
    ["Parking Charges", `₹ ${Number(invoice.trip?.parkingCharges || 0).toLocaleString()}`],
    ["Extra Charges", `₹ ${Number(invoice.trip?.extraCharges || 0).toLocaleString()}`],
    ["Subtotal", `₹ ${Number(invoice.subtotal || 0).toLocaleString()}`],
    [`GST (${invoice.gstPercent || 0}%)`, `₹ ${Number(invoice.gstAmount || 0).toLocaleString()}`],
    ["Final Amount", `₹ ${Number(invoice.finalAmount || 0).toLocaleString()}`],
    ["Paid Amount", `₹ ${Number(invoice.paidAmount || 0).toLocaleString()}`],
    ["Balance", `₹ ${Number(remainingAmount(invoice)).toLocaleString()}`],
    ["Status", invoice.status]
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Unique Carz</h3>
            <p className="text-sm text-slate-500">Tax invoice preview</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 border-b border-slate-100 text-sm last:border-b-0 dark:border-slate-800">
            <div className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">{label}</div>
            <div className="px-3 py-2 text-slate-900 dark:text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => downloadFile(`/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber}.pdf`)}>
          <FileDown className="h-4 w-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm text-slate-900 dark:text-white">{value ?? "-"}</div>
    </div>
  );
}

function buildInvoiceExport(rows: any[]) {
  const headers = ["Invoice", "Client", "Invoice Status", "Payment Status", "Total", "Balance", "Created At"];
  const lines = rows.map((invoice) => [
    invoice.invoiceNumber || "",
    invoice.clientName || "",
    invoice.status || "",
    invoice.paymentStatus || (remainingAmount(invoice) === 0 ? "Paid" : Number(invoice.paidAmount || 0) > 0 ? "Partial" : "Pending"),
    Number(invoice.finalAmount || 0),
    Number(remainingAmount(invoice)),
    invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("en-IN") : ""
  ]);
  return [headers, ...lines].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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

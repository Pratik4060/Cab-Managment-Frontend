import { Download, Eye, FileDown, Mail, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { invoiceActions, sendInvoice } from "../redux/slices/invoiceSlice";
import { downloadFile } from "../utils/downloadFile";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partial" | "Pending";

type InvoiceDutySlipState = {
  kmOut: string;
  kmIn: string;
  timeOut: string;
  timeIn: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstCharges: string;
  status: InvoiceStatus;
  addAmount: string;
};

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const invoices = useAppSelector((s) => s.invoices);

  useEffect(() => {
    dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
  }, [dispatch, statusFilter]);

  const rows = useMemo(() => invoices.items || [], [invoices.items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-slate-500">Preview, export PDF, email, and manage duty slip billing details.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-44" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <button className="btn-secondary" onClick={() => downloadFile("/reports/invoices/export.xlsx", "invoices.xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="panel p-2">
        <DataTable
          loading={invoices.loading}
          rows={rows}
          columns={[
            { key: "invoiceNumber", header: "Invoice" },
            { key: "clientName", header: "Client" },
            { key: "status", header: "Invoice Status", render: (r) => <InvoiceStatusBadge status={r.status} /> },
            { key: "paymentStatus", header: "Payment Status", render: (r) => <PaymentStatusBadge invoice={r} /> },
            { key: "finalAmount", header: "Total", render: (r) => `Rs ${Number(r.finalAmount || 0).toLocaleString()}` },
            { key: "remainingAmount", header: "Balance", render: (r) => `Rs ${Number(remainingAmount(r)).toLocaleString()}` }
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-1.5">
              <button className="btn-secondary p-1.5" title="Preview invoice" onClick={() => setPreviewInvoice(row)}>
                <Eye className="h-4 w-4" />
              </button>
              <button className="btn-secondary p-1.5" title="Edit invoice" onClick={() => setEditTarget(row)}>
                <Pencil className="h-4 w-4" />
              </button>
              <button className="btn-secondary p-1.5" title="Send invoice to client" onClick={() => setSendTarget(row)}>
                <Mail className="h-4 w-4" />
              </button>
              <button className="btn-secondary p-1.5" title="Download PDF" onClick={() => downloadFile(`/invoices/${row._id}/pdf`, `${row.invoiceNumber}.pdf`)}>
                <FileDown className="h-4 w-4" />
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
  const showPartialAmount = form.status === "Partial";

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
        <InfoCard label="Status" value={<select className="input mt-1" value={form.status} onChange={(event) => updateField("status", event.target.value as InvoiceStatus)}>{["Partial", "Paid", "Pending"].map((status) => <option key={status} value={status}>{status}</option>)}</select>} />
        <InfoCard label="Payment Status" value={<PaymentStatusBadge invoice={buildPreviewInvoice(invoice, form)} />} />
        <InfoCard label="KM OUT" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmOut} onChange={(event) => updateField("kmOut", event.target.value)} />} />
        <InfoCard label="KM IN" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.kmIn} onChange={(event) => updateField("kmIn", event.target.value)} />} />
        <InfoCard label="Time OUT" value={<input className="input mt-1" type="datetime-local" value={form.timeOut} onChange={(event) => updateField("timeOut", event.target.value)} />} />
        <InfoCard label="Time IN" value={<input className="input mt-1" type="datetime-local" value={form.timeIn} onChange={(event) => updateField("timeIn", event.target.value)} />} />
        <InfoCard label="Toll Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.tollCharges} onChange={(event) => updateField("tollCharges", event.target.value)} />} />
        <InfoCard label="Parking Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.parkingCharges} onChange={(event) => updateField("parkingCharges", event.target.value)} />} />
        <InfoCard label="Extra Charges" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.extraCharges} onChange={(event) => updateField("extraCharges", event.target.value)} />} />
        <InfoCard label="GST (%)" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.gstCharges} onChange={(event) => updateField("gstCharges", event.target.value)} />} />
        {showPartialAmount && (
          <InfoCard label="Add Amount" value={<input className="input mt-1" type="number" step="any" inputMode="decimal" value={form.addAmount} onChange={(event) => updateField("addAmount", event.target.value)} />} />
        )}
        <InfoCard label="Remaining Amount" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Rs {computed.remainingAmount.toLocaleString()}</p>} />
        <InfoCard label="Total KM" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{computed.totalKm.toLocaleString()}</p>} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setForm(invoiceDutySlipDefaults(invoice))}>Reset</button>
        <button type="button" className="btn-primary" onClick={submit}>Update Invoice</button>
      </div>
    </div>
  );
}

function buildInvoiceUpdatePayload(invoice: any, form: InvoiceDutySlipState) {
  const computed = calculateInvoiceTotals(invoice, form);
  return {
    status: computed.status,
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
    paidAmount: computed.paidAmount,
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
  const addAmount = form.status === "Partial" ? Math.max(0, normalizeNumber(form.addAmount) || 0) : 0;
  const paidAmount = form.status === "Paid"
    ? finalAmount
    : form.status === "Partial"
      ? Math.min(finalAmount, existingPaid + addAmount)
      : existingPaid;
  const remainingAmount = Math.max(0, finalAmount - paidAmount);
  const status = remainingAmount === 0 ? "Paid" : form.status;
  const paymentStatus = status === "Paid" ? "Paid" : status === "Partial" ? "Partial" : paidAmount > 0 ? "Partial" : "Pending";

  return { kmOut, kmIn, totalKm, ratePerKm, tripFare, tollCharges, parkingCharges, extraCharges, gstPercent, gstAmount, subtotal, finalAmount, paidAmount, remainingAmount, status, paymentStatus };
}

function buildPreviewInvoice(invoice: any, form: InvoiceDutySlipState) {
  const computed = calculateInvoiceTotals(invoice, form);
  return {
    ...invoice,
    status: computed.status,
    paymentStatus: computed.paymentStatus,
    finalAmount: computed.finalAmount,
    paidAmount: computed.paidAmount,
    remainingAmount: computed.remainingAmount,
    balanceAmount: computed.remainingAmount
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
    gstCharges: String(invoice.trip?.gstCharges ?? invoice.gstPercent ?? 5),
    status: invoice.status || "Draft",
    addAmount: ""
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
    ["Trip Fare", `Rs ${Number(invoice.tripFare || 0).toLocaleString()}`],
    ["Toll Charges", `Rs ${Number(invoice.trip?.tollCharges || 0).toLocaleString()}`],
    ["Parking Charges", `Rs ${Number(invoice.trip?.parkingCharges || 0).toLocaleString()}`],
    ["Extra Charges", `Rs ${Number(invoice.trip?.extraCharges || 0).toLocaleString()}`],
    ["Subtotal", `Rs ${Number(invoice.subtotal || 0).toLocaleString()}`],
    [`GST (${invoice.gstPercent || 0}%)`, `Rs ${Number(invoice.gstAmount || 0).toLocaleString()}`],
    ["Final Amount", `Rs ${Number(invoice.finalAmount || 0).toLocaleString()}`],
    ["Paid Amount", `Rs ${Number(invoice.paidAmount || 0).toLocaleString()}`],
    ["Remaining Amount", `Rs ${Number(remainingAmount(invoice)).toLocaleString()}`],
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

function normalizeNumber(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDatetimeLocal(value: string | Date) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

import { CreditCard, Download, Eye, FileDown, Mail, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { DataTable } from "../components/tables/DataTable";
import { Modal } from "../components/common/Modal";
import { EntityForm } from "../components/forms/EntityForm";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { invoiceActions, sendInvoice } from "../redux/slices/invoiceSlice";
import { addPayment } from "../redux/slices/paymentSlice";
import { downloadFile } from "../utils/downloadFile";

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const invoices = useAppSelector((s) => s.invoices);
  useEffect(() => { dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {})); }, [dispatch, statusFilter]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-slate-500">Preview, export PDF, email, and track payments.</p></div>
        <div className="flex gap-2">
          <select className="input w-44" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
          <button className="btn-secondary" onClick={() => downloadFile("/reports/invoices/export.xlsx", "invoices.xlsx")}><Download className="h-4 w-4" />Excel</button>
        </div>
      </div>
      <div className="panel p-4">
        <DataTable
          loading={invoices.loading}
          rows={invoices.items}
          columns={[
            { key: "invoiceNumber", header: "Invoice" },
            { key: "clientName", header: "Client" },
            { key: "status", header: "Invoice Status", render: (r) => <InvoiceStatusBadge status={r.status} /> },
            { key: "paymentStatus", header: "Payment Status", render: (r) => <PaymentStatusBadge invoice={r} /> },
            { key: "finalAmount", header: "Total", render: (r) => `Rs ${Number(r.finalAmount || 0).toLocaleString()}` },
            { key: "balanceAmount", header: "Balance", render: (r) => `Rs ${Number(r.balanceAmount || 0).toLocaleString()}` }
          ]}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <button className="btn-secondary p-2" title="Preview invoice" onClick={() => setPreviewInvoice(row)}><Eye className="h-4 w-4" /></button>
              <button className="btn-secondary p-2" title="Edit invoice" onClick={() => setEditTarget(row)}><Pencil className="h-4 w-4" /></button>
              <button className="btn-secondary p-2" title="Send invoice to client" onClick={() => setSendTarget(row)}><Mail className="h-4 w-4" /></button>
              <button className="btn-secondary p-2" title="Record payment" disabled={Number(row.balanceAmount || 0) <= 0} onClick={() => setPaymentTarget(row)}><CreditCard className="h-4 w-4" /></button>
              <button className="btn-secondary p-2" title="Download PDF" onClick={() => downloadFile(`/invoices/${row._id}/pdf`, `${row.invoiceNumber}.pdf`)}><FileDown className="h-4 w-4" /></button>
            </div>
          )}
        />
      </div>
      <Modal open={Boolean(previewInvoice)} title={`Invoice Preview ${previewInvoice?.invoiceNumber || ""}`} onClose={() => setPreviewInvoice(null)}>
        {previewInvoice && <InvoicePreview invoice={previewInvoice} />}
      </Modal>
      <Modal open={Boolean(editTarget)} title={`Edit Invoice ${editTarget?.invoiceNumber || ""}`} onClose={() => setEditTarget(null)}>
        {editTarget && (
          <EntityForm
            fields={[
              { name: "clientName", label: "Client Name", full: true },
              { name: "clientEmail", label: "Client Email", type: "email", full: true, required: false },
              { name: "tripFare", label: "Trip Fare", type: "number" },
              { name: "tollCharges", label: "Toll Charges", type: "number" },
              { name: "parkingCharges", label: "Parking Charges", type: "number" },
              { name: "extraCharges", label: "Extra Charges", type: "number" },
              { name: "gstPercent", label: "GST %", type: "number" },
              { name: "status", label: "Status", type: "select", options: ["Draft", "Sent", "Partial", "Paid", "Overdue"] }
            ]}
            defaults={invoiceEditDefaults(editTarget)}
            schema={invoiceEditSchema}
            submitLabel="Update Invoice"
            onSubmit={async (values) => {
              const tripFare = Number(values.tripFare || 0);
              const tollCharges = Number(values.tollCharges || 0);
              const parkingCharges = Number(values.parkingCharges || 0);
              const extraCharges = Number(values.extraCharges || 0);
              const subtotal = tripFare + tollCharges + parkingCharges + extraCharges;
              const gstPercent = Number(values.gstPercent || 0);
              const gstAmount = Math.round(subtotal * (gstPercent / 100));
              const finalAmount = subtotal + gstAmount;
              const paidAmount = Math.min(Number(editTarget.paidAmount || 0), finalAmount);
              const balanceAmount = Math.max(0, finalAmount - paidAmount);
              await dispatch(invoiceActions.updateOne({
                id: editTarget._id,
                payload: {
                  clientName: values.clientName,
                  clientEmail: values.clientEmail,
                  tripFare,
                  tollCharges,
                  parkingCharges,
                  extraCharges,
                  subtotal,
                  gstPercent,
                  gstAmount,
                  finalAmount,
                  paidAmount,
                  balanceAmount,
                  status: balanceAmount === 0 ? "Paid" : values.status,
                  trip: { ...editTarget.trip, tollCharges, parkingCharges, extraCharges }
                }
              }));
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
      <Modal open={Boolean(paymentTarget)} title={`Record Payment ${paymentTarget?.invoiceNumber || ""}`} onClose={() => setPaymentTarget(null)}>
        {paymentTarget && (
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
            Outstanding balance: <strong>Rs {Number(paymentTarget.balanceAmount || 0).toLocaleString()}</strong>
          </div>
        )}
        <EntityForm
          fields={[
            { name: "amount", label: "Payment Amount", type: "number" },
            { name: "method", label: "Payment Mode", type: "select", options: ["Cash", "UPI", "NEFT", "Cheque", "Bank Transfer", "Other"] },
            { name: "referenceNumber", label: "Reference / Transaction ID", full: true, required: false },
            { name: "notes", label: "Notes", full: true, required: false }
          ]}
          defaults={{ amount: paymentTarget?.balanceAmount || 0, method: "UPI", referenceNumber: "", notes: "" }}
          schema={z.object({
            amount: z.coerce.number().gt(0, "Amount must be greater than zero").max(Number(paymentTarget?.balanceAmount || 0), "Amount cannot exceed outstanding balance"),
            method: z.enum(["Cash", "UPI", "NEFT", "Cheque", "Bank Transfer", "Other"]),
            referenceNumber: z.string().optional(),
            notes: z.string().optional()
          })}
          submitLabel="Save Payment"
          onSubmit={async (values) => {
            await dispatch(addPayment({ ...values, invoiceId: paymentTarget._id, invoiceNumber: paymentTarget.invoiceNumber }));
            setPaymentTarget(null);
          }}
        />
      </Modal>
    </div>
  );
}

type InvoiceLike = Record<string, any>;
type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partial" | "Overdue";

const invoiceEditSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email required").or(z.literal("")).optional(),
  tripFare: z.coerce.number().min(0),
  tollCharges: z.coerce.number().min(0),
  parkingCharges: z.coerce.number().min(0),
  extraCharges: z.coerce.number().min(0),
  gstPercent: z.coerce.number().min(0),
  status: z.enum(["Draft", "Sent", "Partial", "Paid", "Overdue"])
});

function invoiceCharges(invoice: InvoiceLike) {
  const tollCharges = Number(invoice.tollCharges ?? invoice.trip?.tollCharges ?? 0);
  const parkingCharges = Number(invoice.parkingCharges ?? invoice.trip?.parkingCharges ?? 0);
  const extraCharges = Number(invoice.extraCharges ?? invoice.trip?.extraCharges ?? 0);
  const subtotal = Number(invoice.subtotal || 0);
  const tripFare = Number(invoice.tripFare ?? Math.max(0, subtotal - tollCharges - parkingCharges - extraCharges));
  return { tripFare, tollCharges, parkingCharges, extraCharges };
}

function invoiceEditDefaults(invoice: InvoiceLike) {
  return {
    clientName: invoice.clientName || invoice.booking?.businessUnit || "",
    clientEmail: invoice.clientEmail || invoice.booking?.senderEmail || "",
    ...invoiceCharges(invoice),
    gstPercent: invoice.gstPercent ?? 5,
    status: invoice.status || "Draft"
  };
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const styles = {
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    Sent: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-100",
    Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    Partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    Overdue: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status] || styles.Draft}`}>{status}</span>;
}

function PaymentStatusBadge({ invoice }: { invoice: InvoiceLike }) {
  const status = Number(invoice.balanceAmount || 0) === 0 ? "Paid" : Number(invoice.paidAmount || 0) > 0 ? "Partial" : invoice.status === "Sent" ? "Waiting" : "Pending";
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    Partial: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    Waiting: "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-100",
    Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

function InvoicePreview({ invoice }: { invoice: InvoiceLike }) {
  const charges = invoiceCharges(invoice);
  const rows = [
    ["Invoice Number", invoice.invoiceNumber],
    ["Client", invoice.clientName || invoice.booking?.businessUnit || "-"],
    ["Passenger", invoice.booking?.passengerName || "-"],
    ["Booking ID", invoice.booking?.bookingId || "-"],
    ["Trip", invoice.trip?.tripNumber || "-"],
    ["Total KM", invoice.trip?.totalKm || 0],
    ["Trip Fare", `Rs ${charges.tripFare.toLocaleString()}`],
    ["Toll Charges", `Rs ${charges.tollCharges.toLocaleString()}`],
    ["Parking Charges", `Rs ${charges.parkingCharges.toLocaleString()}`],
    ["Extra Charges", `Rs ${charges.extraCharges.toLocaleString()}`],
    ["Subtotal", `Rs ${Number(invoice.subtotal || 0).toLocaleString()}`],
    [`GST (${invoice.gstPercent || 0}%)`, `Rs ${Number(invoice.gstAmount || 0).toLocaleString()}`],
    ["Final Amount", `Rs ${Number(invoice.finalAmount || 0).toLocaleString()}`],
    ["Paid Amount", `Rs ${Number(invoice.paidAmount || 0).toLocaleString()}`],
    ["Balance", `Rs ${Number(invoice.balanceAmount || 0).toLocaleString()}`],
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
        <button className="btn-secondary" onClick={() => downloadFile(`/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber}.pdf`)}><FileDown className="h-4 w-4" />Download PDF</button>
      </div>
    </div>
  );
}


import { Banknote, Download, Eye, FileArchive, FileDown, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { invoiceActions, sendInvoice } from "../redux/slices/invoiceSlice";
import { downloadFile } from "../utils/downloadFile";
import { formatDisplayDate } from "../utils/formatDate";
import { showToast } from "../utils/toast";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partial" | "Pending";
type InvoiceProjectType = "Process" | "Management";

type InvoiceDutySlipState = {
  kmOut: string;
  kmIn: string;
  timeOut: string;
  timeIn: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstCharges: string;
  projectType: InvoiceProjectType;
  billingAddress: string;
};

type InvoicePaymentState = {
  paymentStatus: "Paid" | "Pending";
  paymentType: string;
  remark: string;
};

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState<InvoiceProjectType | "">("");
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
  const filteredRows = useMemo(() => {
    if (!projectTypeFilter) return rows;
    return rows.filter((invoice) => getInvoiceProjectType(invoice) === projectTypeFilter);
  }, [projectTypeFilter, rows]);
  const selectedInvoices = filteredRows.filter((invoice) => selectedInvoiceIds.includes(String(invoice._id)));
  const exportQuery = new URLSearchParams({
    ...(dateFilters.from ? { from: dateFilters.from } : {}),
    ...(dateFilters.to ? { to: dateFilters.to } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(projectTypeFilter ? { projectType: projectTypeFilter } : {}),
    ...(selectedInvoiceIds.length ? { selected: selectedInvoiceIds.join(",") } : {})
  }).toString();

  useEffect(() => {
    const visibleIds = new Set(filteredRows.map((invoice) => String(invoice._id)));
    setSelectedInvoiceIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [filteredRows]);

  function toggleInvoiceSelection(id: string) {
    setSelectedInvoiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function exportInvoices(format: "xlsx" | "pdf") {
    const exportRows = selectedInvoices.length ? selectedInvoices : filteredRows;
    downloadFile(
      `/reports/invoices/export.${format}${exportQuery ? `?${exportQuery}` : ""}`,
      `invoices.${format}`,
      format === "pdf" ? buildBulkPdfExport(exportRows) : buildInvoiceExport(exportRows)
    );
  }

  return (
    <div className="relative space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Invoices</h1>
          <p className="text-sm text-slate-500">Preview, export PDF, email, and manage duty slip billing details.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
       
          <select className="input w-28" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <input className="input w-32" type="date" value={dateFilters.from} onChange={(event) => setDateFilters((filters) => ({ ...filters, from: event.target.value }))} aria-label="Invoice from date" />
          <input className="input w-32" type="date" value={dateFilters.to} onChange={(event) => setDateFilters((filters) => ({ ...filters, to: event.target.value }))} aria-label="Invoice to date" />
          <button className="btn-secondary" onClick={() => exportInvoices("xlsx")}>
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button className="btn-secondary" onClick={() => exportInvoices("pdf")}>
            <FileArchive className="h-4 w-4" />
            Bulk PDFs
          </button>
          <button
            className="btn-secondary"
            onClick={() => setBulkSendOpen(true)}
          >
            <Mail className="h-4 w-4" />
            Bulk Send
          </button>
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Invoice
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(["Process", "Management"] as InvoiceProjectType[]).map((type) => {
          const typeRows = rows.filter((invoice) => getInvoiceProjectType(invoice) === type);
          const isActive = projectTypeFilter === type;

          return (
            <button
              key={type}
              type="button"
              className={`panel p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${isActive ? "ring-2 ring-brand-500" : ""}`}
              onClick={() => setProjectTypeFilter((current) => current === type ? "" : type)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{type}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{typeRows.length}</h2>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel p-2">
        <DataTable
          loading={invoices.loading}
          loadingMessage={invoices.requestMessage || "Loading invoices..."}
          rows={filteredRows}
          selectable
          selectedIds={selectedInvoiceIds}
          onToggleRow={toggleInvoiceSelection}
          onToggleAll={setSelectedInvoiceIds}
          columns={[
            { key: "invoiceNumber", header: "Invoice" },
            {
              key: "createdAt",
              header: "Date",
              render: (r) => formatDisplayDate(r.invoiceDate || r.createdAt),
            },
            { key: "clientName", header: "Client" },
            { key: "status", header: "Invoice Status", render: (r) => <InvoiceStatusBadge status={r.status} /> },
            { key: "paymentStatus", header: "Payment Status", render: (r) => <PaymentStatusBadge invoice={r} /> },
            { key: "finalAmount", header: "Total", render: (r) => `₹ ${Number(r.finalAmount || 0).toLocaleString()}` },
            { key: "remainingAmount", header: "Balance", render: (r) => `₹ ${Number(remainingAmount(r)).toLocaleString()}` }
          ]}
          actionCount={7}
          actions={(row) => (
            <div className="flex min-w-36 flex-col gap-1.5">
              <button className="btn-secondary w-full justify-start p-2" title="Preview invoice" onClick={async () => setPreviewInvoice(await dispatch(invoiceActions.fetchById(row._id)).unwrap())}>
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
              <button className="btn-secondary w-full justify-start p-2" title="Download PDF" onClick={() => downloadInvoicePdf(row)}>
                <FileDown className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2" title="Booking PDF" onClick={() => exportBookingPdf(row)}>
                <FileArchive className="h-4 w-4" />
                <span>Booking PDF</span>
              </button>
              <button className="btn-secondary w-full justify-start p-2 text-red-600 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200" title="Delete invoice" onClick={() => setDeleteTarget(row)}>
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        />
      </div>

      <Modal open={Boolean(previewInvoice)} title={`Invoice Preview ${previewInvoice?.invoiceNumber || ""}`} onClose={() => setPreviewInvoice(null)}>
        {previewInvoice && <InvoicePreview invoice={previewInvoice} onDownload={() => downloadInvoicePdf(previewInvoice)} />}
      </Modal>
      <Modal open={addOpen} title="Add Invoice" onClose={() => setAddOpen(false)}>
        <AddInvoiceForm
          onSubmit={async (values) => {
            await dispatch(invoiceActions.createOne(values)).unwrap();
            await dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
            setAddOpen(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editTarget)} title={`Edit Invoice ${editTarget?.invoiceNumber || ""}`} onClose={() => setEditTarget(null)}>
        {editTarget && (
          <InvoiceDutySlipEditor
            invoice={editTarget}
            onSubmit={async (payload) => {
              await dispatch(invoiceActions.updateOne({ id: editTarget._id, payload })).unwrap();
              await dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
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
              await dispatch(invoiceActions.updatePaymentStatus({ id: paymentTarget._id, payload })).unwrap();
              await dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
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
            await dispatch(sendInvoice({ id: sendTarget._id, payload: values })).unwrap();
            await dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
            setSendTarget(null);
          }}
        />
      </Modal>
      <Modal open={bulkSendOpen} title="Bulk Send Invoices" onClose={() => setBulkSendOpen(false)}>
        <EntityForm
          fields={[
            { name: "status", label: "Invoice Status", type: "select", options: ["Pending", "Draft", "Sent", "Paid", "Partial"], required: false },
            { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Pending", "Paid"], required: false },
            { name: "from", label: "From", type: "date", required: false },
            { name: "to", label: "To", type: "date", required: false },
            { name: "search", label: "Search", required: false },
            { name: "emailSubject", label: "Email Subject", full: true },
            { name: "emailBody", label: "Email Body", full: true }
          ]}
          defaults={{
            status: statusFilter || "Pending",
            paymentStatus: "Pending",
            from: dateFilters.from,
            to: dateFilters.to,
            search: "",
            emailSubject: "Pending Invoices",
            emailBody: "Please find the attached invoice list."
          }}
          schema={z.object({
            status: z.string().optional(),
            paymentStatus: z.string().optional(),
            from: z.string().optional(),
            to: z.string().optional(),
            search: z.string().optional(),
            emailSubject: z.string().min(1, "Email subject is required"),
            emailBody: z.string().min(1, "Email body is required")
          })}
          submitLabel="Send Bulk"
          onSubmit={async (values) => {
            const response = await dispatch(invoiceActions.sendBulkInvoices(values)).unwrap();
            if (!response?.message) {
              showToast({ type: "success", title: "Bulk send started", message: "Bulk invoice email request submitted successfully." });
            }
            setBulkSendOpen(false);
          }}
        />
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Invoice"
        prompt="Are you sure you want to delete this invoice?"
        confirmLabel="Delete"
        message={`This will permanently delete ${deleteTarget?.invoiceNumber || "this invoice"}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget?._id) {
            await dispatch(invoiceActions.deleteOne(deleteTarget._id)).unwrap();
            await dispatch(invoiceActions.fetchAll(statusFilter ? { status: statusFilter } : {}));
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );

  async function downloadInvoicePdf(invoice: any) {
    const result = await dispatch(invoiceActions.downloadPdf(invoice._id)).unwrap();
    const blobUrl = window.URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
    showToast({ type: "success", title: "Download ready", message: "Invoice PDF downloaded successfully." });
  }

  function exportBookingPdf(invoice: any) {
    const bookingId = invoice.bookingId || invoice.booking?.bookingId || invoice.booking?._id;
    const bookingInvoices = filteredRows.filter((row) => String(row.bookingId || row.booking?.bookingId || row.booking?._id) === String(bookingId));
    downloadFile(
      `/bookings/${bookingId}/invoice-pack.pdf`,
      `booking-${bookingId || "invoice-pack"}.pdf`,
      buildBookingPdfExport(invoice, bookingInvoices.length ? bookingInvoices : [invoice])
    );
  }
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
        <InfoCard label="Project Type" value={getInvoiceProjectType(invoice)} />
        <InfoCard label="Billing Address" value={invoice.billingAddress || invoice.trip?.billingAddress || invoice.booking?.reportingAddress || invoice.booking?.dropAddress || "-"} />
        <InfoCard label="KM OUT" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.kmOut} onChange={(event) => updateField("kmOut", event.target.value)} />} />
        <InfoCard label="KM IN" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.kmIn} onChange={(event) => updateField("kmIn", event.target.value)} />} />
        <InfoCard label="Time OUT" value={<input className="input mt-1" type="datetime-local" value={form.timeOut} onChange={(event) => updateField("timeOut", event.target.value)} />} />
        <InfoCard label="Time IN" value={<input className="input mt-1" type="datetime-local" value={form.timeIn} onChange={(event) => updateField("timeIn", event.target.value)} />} />
        <InfoCard label="Project Type" value={<select className="input mt-1" value={form.projectType} onChange={(event) => updateField("projectType", event.target.value as InvoiceProjectType)}><option value="Process">Process</option><option value="Management">Management</option></select>} />
        <InfoCard label="Address" value={<input className="input mt-1" type="text" value={form.billingAddress} onChange={(event) => updateField("billingAddress", event.target.value)} placeholder="Enter address" />} />
        <InfoCard label="Toll Charges" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.tollCharges} onChange={(event) => updateField("tollCharges", event.target.value)} />} />
        <InfoCard label="Parking Charges" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.parkingCharges} onChange={(event) => updateField("parkingCharges", event.target.value)} />} />
        <InfoCard label="Extra Charges" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.extraCharges} onChange={(event) => updateField("extraCharges", event.target.value)} />} />
        <InfoCard label="GST (%)" value={<input className="input mt-1" type="number" step="any" min="0" inputMode="decimal" value={form.gstCharges} onChange={(event) => updateField("gstCharges", event.target.value)} />} />
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

type AddInvoiceFormState = {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  projectType: InvoiceProjectType;
  billingAddress: string;
  kmOut: string;
  kmIn: string;
  tripFare: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstPercent: string;
};

function AddInvoiceForm({ onSubmit }: { onSubmit: (payload: any) => Promise<void> | void }) {
  const [form, setForm] = useState<AddInvoiceFormState>({
    bookingId: "",
    clientName: "",
    clientEmail: "",
    projectType: "Process",
    billingAddress: "",
    kmOut: "",
    kmIn: "",
    tripFare: "",
    tollCharges: "0",
    parkingCharges: "0",
    extraCharges: "0",
    gstPercent: "18"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const kmOut = normalizeNumber(form.kmOut);
  const kmIn = normalizeNumber(form.kmIn);
  const totalKm = kmOut !== null && kmIn !== null ? Math.max(0, kmIn - kmOut) : 0;
  const tripFare = normalizeNumber(form.tripFare) ?? 0;
  const tollCharges = normalizeNumber(form.tollCharges) ?? 0;
  const parkingCharges = normalizeNumber(form.parkingCharges) ?? 0;
  const extraCharges = normalizeNumber(form.extraCharges) ?? 0;
  const gstPercent = normalizeNumber(form.gstPercent) ?? 0;
  const subtotal = tripFare + tollCharges + parkingCharges + extraCharges;
  const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

  function updateField(field: keyof AddInvoiceFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAddInvoiceForm(form, totalKm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        bookingId: form.bookingId.trim(),
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        projectType: form.projectType,
        billingAddress: form.billingAddress.trim(),
        tripFare,
        totalKm,
        kmOut: Number(form.kmOut),
        kmIn: Number(form.kmIn),
        tollCharges,
        parkingCharges,
        extraCharges,
        gstPercent
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <InvoiceInput label="Booking ID" value={form.bookingId} error={errors.bookingId} onChange={(value) => updateField("bookingId", value)} />
      <InvoiceInput label="Client Name" value={form.clientName} error={errors.clientName} onChange={(value) => updateField("clientName", value)} />
      <InvoiceInput label="Client Email" type="email" value={form.clientEmail} error={errors.clientEmail} onChange={(value) => updateField("clientEmail", value)} />
      <label>
        <RequiredLabel>Project Type</RequiredLabel>
        <select className="input" value={form.projectType} onChange={(event) => updateField("projectType", event.target.value as InvoiceProjectType)}>
          <option value="Process">Process</option>
          <option value="Management">Management</option>
        </select>
      </label>
      <InvoiceInput label="Billing Address" value={form.billingAddress} error={errors.billingAddress} onChange={(value) => updateField("billingAddress", value)} full />
      <InvoiceInput label="KM Out" type="number" value={form.kmOut} error={errors.kmOut} onChange={(value) => updateField("kmOut", value)} />
      <InvoiceInput label="KM In" type="number" value={form.kmIn} error={errors.kmIn} onChange={(value) => updateField("kmIn", value)} />
      <ComputedField label="Total KM" value={totalKm.toLocaleString()} />
      <InvoiceInput label="Trip Fare" type="number" value={form.tripFare} error={errors.tripFare} onChange={(value) => updateField("tripFare", value)} />
      <InvoiceInput label="Toll Charges" type="number" value={form.tollCharges} error={errors.tollCharges} onChange={(value) => updateField("tollCharges", value)} />
      <InvoiceInput label="Parking Charges" type="number" value={form.parkingCharges} error={errors.parkingCharges} onChange={(value) => updateField("parkingCharges", value)} />
      <InvoiceInput label="Extra Charges" type="number" value={form.extraCharges} error={errors.extraCharges} onChange={(value) => updateField("extraCharges", value)} />
      <ComputedField label="Subtotal Without GST" value={`₹ ${subtotal.toLocaleString()}`} />
      <InvoiceInput label="GST (%)" type="number" value={form.gstPercent} error={errors.gstPercent} onChange={(value) => updateField("gstPercent", value)} />
      <ComputedField label="GST Amount" value={`₹ ${gstAmount.toLocaleString()}`} />
      <ComputedField label="Total Amount" value={`₹ ${totalAmount.toLocaleString()}`} />
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Invoice"}</button>
      </div>
    </form>
  );
}

function InvoiceInput({ label, value, error, onChange, type = "text", full = false }: { label: string; value: string; error?: string; onChange: (value: string) => void; type?: string; full?: boolean }) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <RequiredLabel>{label}</RequiredLabel>
      <input className="input" type={type} step={type === "number" ? "any" : undefined} min={type === "number" ? 0 : undefined} inputMode={type === "number" ? "decimal" : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

function ComputedField({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input className="input bg-slate-50 font-semibold text-slate-700 dark:bg-slate-900/70 dark:text-slate-100" value={value} readOnly />
    </label>
  );
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{children}<span className="ml-0.5 text-brand-600">*</span></span>;
}

function RequestOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/45 backdrop-blur-sm dark:bg-black/45">
      <div className="rounded-2xl border border-brand-100 bg-white px-6 py-5 text-center shadow-2xl shadow-brand-600/20 dark:border-red-950/45 dark:bg-[#111114]">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-600 dark:text-brand-200" />
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
      </div>
    </div>
  );
}

function validateAddInvoiceForm(form: AddInvoiceFormState, totalKm: number) {
  const errors: Record<string, string> = {};
  const required: Array<keyof AddInvoiceFormState> = ["bookingId", "clientName", "clientEmail", "billingAddress", "kmOut", "kmIn", "tripFare", "tollCharges", "parkingCharges", "extraCharges", "gstPercent"];
  for (const field of required) {
    if (!String(form[field] ?? "").trim()) errors[field] = "Required";
  }
  if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) errors.clientEmail = "Enter a valid email address.";
  for (const field of ["kmOut", "kmIn", "tripFare", "tollCharges", "parkingCharges", "extraCharges", "gstPercent"] as const) {
    const value = normalizeNumber(form[field]);
    if (value === null || value < 0) errors[field] = "Enter a number 0 or greater.";
  }
  if (normalizeNumber(form.kmOut) !== null && normalizeNumber(form.kmIn) !== null && totalKm <= 0) {
    errors.kmIn = "KM In must be greater than KM Out";
  }
  return errors;
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
        <InfoCard label="Payment Status" value={<select className="input mt-1" value={form.paymentStatus} onChange={(event) => updateField("paymentStatus", event.target.value as InvoicePaymentState["paymentStatus"])}>{["Pending", "Paid"].map((status) => <option key={status} value={status}>{status}</option>)}</select>} />
        <InfoCard label="Payment Type" value={<select className="input mt-1" value={form.paymentType} onChange={(event) => updateField("paymentType", event.target.value as InvoicePaymentState["paymentType"])}>{["Cash", "UPI","Cheque","NEFT", "RTGS","Other"].map((type) => <option key={type} value={type}>{type}</option>)}</select>} />
        <InfoCard label="Remark" value={<textarea className="input mt-1 min-h-24" value={form.remark} onChange={(event) => updateField("remark", event.target.value)} />} />
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
    projectType: form.projectType,
    billingAddress: form.billingAddress || undefined,
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
      projectType: form.projectType,
      billingAddress: form.billingAddress || undefined,
      tollCharges: computed.tollCharges,
      parkingCharges: computed.parkingCharges,
      extraCharges: computed.extraCharges,
      gstCharges: computed.gstPercent
    }
  };
}

function buildPaymentUpdatePayload(invoice: any, form: InvoicePaymentState) {
  return {
    paymentStatus: form.paymentStatus,
    paymentType: form.paymentType || undefined,
    addAmount: form.paymentStatus === "Paid" ? remainingAmount(invoice) : 0,
    remark: form.remark.trim() || undefined
  };
}

function calculateInvoiceTotals(invoice: any, form: InvoiceDutySlipState) {
  const kmOut = normalizeNumber(form.kmOut);
  const kmIn = normalizeNumber(form.kmIn);
  const totalKm = kmOut !== null && kmIn !== null && kmIn >= kmOut ? kmIn - kmOut : Number(invoice.trip?.totalKm || 0);
  const ratePerKm = Number(invoice.trip?.vehicle?.rate_per_km || invoice.trip?.vehicle?.ratePerKm || invoice.tripFare / Math.max(1, Number(invoice.trip?.totalKm || 1)) || 22);
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
  const paidAmount = form.paymentStatus === "Paid"
    ? finalAmount
    : existingPaid;
  const remainingAmount = Math.max(0, finalAmount - paidAmount);

  return {
    paymentStatus: remainingAmount === 0 ? "Paid" : "Pending",
    paidAmount,
    remainingAmount
  } satisfies { paymentStatus: string; paidAmount: number; remainingAmount: number };
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
  const currentStatus = invoice.paymentStatus === "Paid" || Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0) === 0
    ? "Paid"
    : "Pending";

  return {
    paymentStatus: currentStatus,
    paymentType: String(invoice.paymentType || invoice.payment_type || "Cash"),
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
    gstCharges: String(invoice.trip?.gstCharges ?? invoice.gstPercent ?? 18),
    projectType: getInvoiceProjectType(invoice),
    billingAddress: String(invoice.billingAddress || invoice.trip?.billingAddress || invoice.booking?.reportingAddress || invoice.booking?.dropAddress || "")
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
  const status = invoice.paymentStatus === "Paid" || amount === 0 ? "Paid" : "Pending";
  const styles: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

function InvoicePreview({ invoice, onDownload }: { invoice: any; onDownload: () => void }) {
  const rows = getInvoicePreviewRows(invoice);

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
            <p className="text-xs text-slate-500">{formatDisplayDate(invoice.createdAt)}</p>
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
        <button className="btn-secondary" onClick={onDownload}>
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
  const headers = getInvoicePreviewRows(rows[0] || {}).map(([label]) => label);
  const lines = rows.map((invoice) => getInvoicePreviewRows(invoice).map(([, value]) => value));

  return [headers, ...lines]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

function buildBulkPdfExport(rows: any[]) {
  return [
    "Unique Carz Bulk Invoice PDF Export",
    `Generated: ${formatDisplayDate(new Date())}`,
    "",
    ...rows.flatMap((invoice, index) => [
      `Invoice ${index + 1}`,
      ...getInvoicePreviewRows(invoice).map(([label, value]) => `${label}: ${value}`),
      ""
    ])
  ].join("\n");
}

function buildBookingPdfExport(anchorInvoice: any, rows: any[]) {
  const booking = anchorInvoice.booking || {};
  return [
    "Unique Carz Booking Invoice Pack",
    `Booking ID: ${booking.bookingId || anchorInvoice.bookingId || "-"}`,
    `Cab Request No: ${booking.cabRequestNumber || anchorInvoice.cabRequestNumber || "-"}`,
    `Passenger: ${booking.passengerName || anchorInvoice.passengerName || "-"}`,
    `Business Unit: ${booking.businessUnit || anchorInvoice.businessUnit || "-"}`,
    `Reference Email Screenshot: ${booking.emailScreenshot || anchorInvoice.emailScreenshot ? "Attached / available in booking record" : "Not available"}`,
    "",
    "Invoices",
    ...rows.flatMap((invoice, index) => [
      `Invoice ${index + 1}`,
      ...getInvoicePreviewRows(invoice).map(([label, value]) => `${label}: ${value}`),
      ""
    ])
  ].join("\n");
}

function getInvoicePreviewRows(invoice: any): Array<[string, any]> {
  const booking = invoice.booking || {};
  const trip = invoice.trip || {};
  const paymentStatus = invoice.paymentStatus === "Paid" || remainingAmount(invoice) <= 0 ? "Paid" : "Pending";

  return [
    ["Invoice Number", invoice.invoiceNumber || "-"],
    ["Invoice Date", formatDisplayDate(invoice.invoiceDate || invoice.createdAt)],
    ["Booking ID", booking.bookingId || invoice.bookingId || "-"],
    ["Cab Request No", booking.cabRequestNumber || invoice.cabRequestNumber || "-"],
    ["Business Unit", booking.businessUnit || invoice.businessUnit || "-"],
    ["Passenger", booking.passengerName || invoice.passengerName || "-"],
    ["Client", invoice.clientName || booking.businessUnit || "-"],
    ["Client Email", invoice.clientEmail || booking.senderEmail || "-"],
    ["Project Type", getInvoiceProjectType(invoice)],
    ["Billing Address", invoice.billingAddress || trip.billingAddress || booking.reportingAddress || "-"],
    ["Reporting Address", booking.reportingAddress || invoice.reportingAddress || "-"],
    ["Drop Address", booking.dropAddress || invoice.dropAddress || "-"],
    ["KM Out", invoice.kmOut ?? trip.kmOut ?? "-"],
    ["KM In", invoice.kmIn ?? trip.kmIn ?? "-"],
    ["Total KM", invoice.totalKm || trip.totalKm || 0],
    ["Time Out", invoice.timeOut || trip.timeOut ? formatDisplayDate(invoice.timeOut || trip.timeOut) : "-"],
    ["Time In", invoice.timeIn || trip.timeIn ? formatDisplayDate(invoice.timeIn || trip.timeIn) : "-"],
    ["Trip Fare", `₹ ${Number(invoice.tripFare || 0).toLocaleString()}`],
    ["Toll Charges", `₹ ${Number(invoice.tollCharges ?? trip.tollCharges ?? 0).toLocaleString()}`],
    ["Parking Charges", `₹ ${Number(invoice.parkingCharges ?? trip.parkingCharges ?? 0).toLocaleString()}`],
    ["Extra Charges", `₹ ${Number(invoice.extraCharges ?? trip.extraCharges ?? 0).toLocaleString()}`],
    ["Subtotal", `₹ ${Number(invoice.subtotal || 0).toLocaleString()}`],
    [`GST (${invoice.gstPercent || trip.gstCharges || 0}%)`, `₹ ${Number(invoice.gstAmount || 0).toLocaleString()}`],
    ["Final Amount", `₹ ${Number(invoice.finalAmount || 0).toLocaleString()}`],
    ["Paid Amount", `₹ ${Number(invoice.paidAmount || 0).toLocaleString()}`],
    ["Balance", `₹ ${Number(remainingAmount(invoice)).toLocaleString()}`],
    ["Invoice Status", invoice.status || "-"],
    ["Payment Status", paymentStatus],
    ["Payment Remark", invoice.paymentRemark || "-"],
    ["Created At", formatDisplayDate(invoice.createdAt)],
    ["Updated At", invoice.updatedAt ? formatDisplayDate(invoice.updatedAt) : "-"]
  ];
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

function getInvoiceProjectType(invoice: any): InvoiceProjectType {
  const value = String(invoice?.projectType || invoice?.trip?.projectType || invoice?.booking?.projectType || "");
  if (value.trim().toLowerCase() === "management") return "Management";
  if (value.trim().toLowerCase() === "process") return "Process";
  return Boolean(String(invoice?.booking?.costCenterOfProject ?? "").trim()) ? "Management" : "Process";
}

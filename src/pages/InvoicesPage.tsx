import { Banknote, ChevronDown, ChevronRight, Download, Eye, FileArchive, FileDown, Loader2, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { z } from "zod";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { invoiceActions, sendInvoice } from "../redux/slices/invoiceSlice";
import { bookingActions } from "../redux/slices/bookingSlice";
import { formatDisplayDate } from "../utils/formatDate";
import { showToast } from "../utils/toast";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partial" | "Pending";
type InvoiceProjectType = "Process" | "Management";
type InvoiceViewMode = "present" | "booking";

type InvoiceDutySlipState = {
  kmOut: string;
  kmIn: string;
  vehicleChargesPerKm: string;
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

function parseDateOnly(value?: string | Date | null) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toEndOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [sendTarget, setSendTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState<InvoiceProjectType | "">("");
  const [dateFilters, setDateFilters] = useState({ from: "", to: "" });
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedBookingGroupIds, setSelectedBookingGroupIds] = useState<string[]>([]);
  const [expandedBookingGroupIds, setExpandedBookingGroupIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<InvoiceViewMode>("present");
  const [bulkSendConfirmOpen, setBulkSendConfirmOpen] = useState(false);
  const [bulkSendInvoiceCount, setBulkSendInvoiceCount] = useState(0);
  const [bulkSendIsSelected, setBulkSendIsSelected] = useState(false);
  const invoices = useAppSelector((s) => s.invoices);
  const bookings = useAppSelector((s) => s.bookings.allItems);

  useEffect(() => {
    dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
  }, [dispatch, paymentStatusFilter]);

  useEffect(() => {
    dispatch(bookingActions.fetchAll({}));
  }, [dispatch]);

  const effectiveDateRange = useMemo(() => {
    if (!dateFilters.from && !dateFilters.to) {
      return { from: null as Date | null, to: null as Date | null };
    }

    const invoiceDates = (invoices.items || [])
      .map((invoice) => parseDateOnly(invoice.invoiceDate || invoice.createdAt || invoice.updatedAt))
      .filter((date): date is Date => Boolean(date));

    const minInvoiceDate = invoiceDates.length
      ? new Date(Math.min(...invoiceDates.map((date) => date.getTime())))
      : null;

    const selectedFrom = parseDateOnly(dateFilters.from);
    const selectedTo = parseDateOnly(dateFilters.to);
    const defaultTo = selectedFrom ? parseDateOnly(new Date()) : null;
    const defaultFrom = selectedTo ? minInvoiceDate : null;

    let from = selectedFrom || defaultFrom;
    let to = selectedTo || defaultTo;

    if (from && to && from > to) {
      [from, to] = [to, from];
    }

    return { from, to };
  }, [dateFilters.from, dateFilters.to, invoices.items]);

  const rows = useMemo(() => {
    if (!effectiveDateRange.from && !effectiveDateRange.to) {
      return invoices.items || [];
    }

    return (invoices.items || []).filter((invoice) => {
      const invoiceDate = parseDateOnly(invoice.invoiceDate || invoice.createdAt || invoice.updatedAt);
      if (!invoiceDate) return false;
      if (effectiveDateRange.from && invoiceDate < effectiveDateRange.from) return false;
      if (effectiveDateRange.to && invoiceDate > toEndOfDay(effectiveDateRange.to)) return false;
      return true;
    });
  }, [effectiveDateRange, invoices.items]);
  const filteredRows = useMemo(() => {
    if (!projectTypeFilter) return rows;
    return rows.filter((invoice) => getInvoiceProjectType(invoice) === projectTypeFilter);
  }, [projectTypeFilter, rows]);
  const invoiceGroups = useMemo(() => buildInvoiceGroups(filteredRows), [filteredRows]);
  const selectedBookingGroups = invoiceGroups.filter((group) => selectedBookingGroupIds.includes(group._id));
  const selectedBookingIds = viewMode === "booking" ? selectedBookingGroups.map((group) => group.bookingId) : [];
  const selectedActionInvoiceIds = viewMode === "present"
    ? selectedInvoiceIds
    : Array.from(new Set([...selectedInvoiceIds, ...selectedBookingGroups.flatMap((group) => group.invoiceIds)]));

  useEffect(() => {
    const visibleIds = new Set(filteredRows.map((invoice) => String(invoice._id)));
    setSelectedInvoiceIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [filteredRows]);

  useEffect(() => {
    const visibleIds = new Set(invoiceGroups.map((group) => group._id));
    setSelectedBookingGroupIds((current) => current.filter((id) => visibleIds.has(id)));
    setExpandedBookingGroupIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [invoiceGroups]);

  function toggleInvoiceSelection(id: string) {
    setSelectedInvoiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function exportInvoices(format: "xlsx" | "pdf") {
    const result = await dispatch(invoiceActions.exportInvoices(buildExportPayload(format))).unwrap();
    downloadBlob(result.blob, `invoices.${format}`);
    showToast({ type: "success", title: "Download ready", message: `${format === "xlsx" ? "Excel" : "PDF"} report downloaded successfully.` });
  }

  async function handleBulkSend() {
    const invoiceIds = selectedActionInvoiceIds.length
      ? selectedActionInvoiceIds
      : filteredRows.map((invoice) => String(invoice._id)).filter(Boolean);

    if (!invoiceIds.length) {
      showToast({ type: "info", title: "No invoices selected", message: "Select at least one invoice to send." });
      return;
    }

    setBulkSendInvoiceCount(invoiceIds.length);
    setBulkSendIsSelected(selectedActionInvoiceIds.length > 0);
    setBulkSendConfirmOpen(true);
  }

  async function proceedWithBulkSend() {
    const invoiceIds = selectedActionInvoiceIds.length
      ? selectedActionInvoiceIds
      : filteredRows.map((invoice) => String(invoice._id)).filter(Boolean);

    await dispatch(invoiceActions.sendBulkInvoices({ invoiceIds })).unwrap();
    showToast({
      type: "success",
      title: "Invoices Sent",
      message: `${invoiceIds.length} invoice${invoiceIds.length > 1 ? "s have" : " has"} been sent to their respective clients.`
    });
    setBulkSendConfirmOpen(false);
  }

  function toggleBookingGroupSelection(id: string) {
    setSelectedBookingGroupIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleBookingGroupExpansion(id: string) {
    setExpandedBookingGroupIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function setGroupInvoiceSelection(group: any, ids: string[]) {
    const groupInvoiceIds = new Set(group.invoiceIds.map(String));
    setSelectedInvoiceIds((current) => [...current.filter((id) => !groupInvoiceIds.has(id)), ...ids]);
  }

  function renderInvoiceActions(row: any) {
    return (
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
    );
  }

  return (
    <div className="relative space-y-3 sm:space-y-3.5 px-2 sm:px-0">
      {invoices.loading && <RequestOverlay message={invoices.requestMessage || "Processing invoice request..."} />}
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl font-bold">Invoices</h1>
          <p className="text-xs sm:text-sm text-slate-500">Preview, export PDF, email, and manage duty slip billing details.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto text-xs sm:text-sm py-1 px-2 sm:py-1.5 sm:px-3 lg:h-8 lg:px-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Invoice
        </button>
      </div>

      {/* Filters Section - Fixed for iPad */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-2 sm:gap-3">
        {/* View Mode Toggle - Made smaller for iPad */}
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-brand-100 bg-white p-0.5 w-full lg:w-auto dark:border-red-950/40 dark:bg-[#111114]">
          <button
            type="button"
            className={`rounded-md px-2 sm:px-3 lg:px-3 py-1 lg:py-1 text-xs lg:text-sm font-semibold transition flex-1 lg:flex-none ${viewMode === "present" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-red-950/20"}`}
            onClick={() => setViewMode("present")}
          >
            List View
          </button>
          <button
            type="button"
            className={`rounded-md px-2 sm:px-3 lg:px-3 py-1 lg:py-1 text-xs lg:text-sm font-semibold transition flex-1 lg:flex-none ${viewMode === "booking" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-red-950/20"}`}
            onClick={() => setViewMode("booking")}
          >
            By Booking
          </button>
        </div>

        {/* Filter Controls - Date filters on next line for iPad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3">
          <select 
            className="input w-full text-xs h-8 sm:h-8 lg:h-8 lg:text-sm" 
            value={paymentStatusFilter} 
            onChange={(event) => setPaymentStatusFilter(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <input 
            className="input w-full text-xs h-8 sm:h-8 lg:h-8 lg:text-sm" 
            type="date" 
            value={dateFilters.from} 
            onChange={(event) => setDateFilters((filters) => ({ ...filters, from: event.target.value }))} 
            aria-label="Invoice from date" 
          />
          <input 
            className="input w-full text-xs h-8 sm:h-8 lg:h-8 lg:text-sm" 
            type="date" 
            value={dateFilters.to} 
            onChange={(event) => setDateFilters((filters) => ({ ...filters, to: event.target.value }))} 
            aria-label="Invoice to date" 
          />
        </div>

        {/* Action Buttons - Made smaller for iPad */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2 w-full lg:w-auto">
          <button className="btn-secondary w-full text-xs py-1 px-1.5 sm:text-sm sm:py-1.5 lg:h-8 lg:px-2" onClick={() => exportInvoices("xlsx")}>
            <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            <span className="text-[10px] sm:text-xs lg:text-sm">Excel</span>
          </button>
          <button className="btn-secondary w-full text-xs py-1 px-1.5 sm:text-sm sm:py-1.5 lg:h-8 lg:px-2" onClick={() => exportInvoices("pdf")}>
            <FileArchive className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            <span className="text-[10px] sm:text-xs lg:text-sm">Bulk PDFs</span>
          </button>
          <button
            className="btn-secondary w-full text-xs py-1 px-1.5 sm:text-sm sm:py-1.5 lg:h-8 lg:px-2"
            onClick={handleBulkSend}
          >
            <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            <span className="text-[10px] sm:text-xs lg:text-sm">Bulk Send</span>
          </button>
        </div>
      </div>

      {/* Project Type Cards */}
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

      {/* Main Table Section - Responsive for all devices */}
      <div className="panel p-2 overflow-x-auto -mx-2 sm:mx-0">
        {viewMode === "present" && (
        <div className="min-w-[600px] md:min-w-0">
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
            actions={renderInvoiceActions}
          />
        </div>
        )}
        {viewMode === "booking" && (
          <BookingInvoiceGroups
            groups={invoiceGroups}
            loading={invoices.loading}
            loadingMessage={invoices.requestMessage || "Loading grouped invoices..."}
            selectedGroupIds={selectedBookingGroupIds}
            selectedInvoiceIds={selectedInvoiceIds}
            expandedGroupIds={expandedBookingGroupIds}
            onToggleGroup={toggleBookingGroupSelection}
            onToggleGroupAll={setSelectedBookingGroupIds}
            onToggleExpand={toggleBookingGroupExpansion}
            onToggleInvoice={toggleInvoiceSelection}
            onToggleGroupInvoices={setGroupInvoiceSelection}
            onBookingPdf={(invoice) => exportBookingPdf(invoice)}
            onBulkSend={() => handleBulkSend()}
            renderInvoiceActions={renderInvoiceActions}
          />
        )}
      </div>

      {/* Modals */}
      <Modal open={Boolean(previewInvoice)} title={`Invoice Preview ${previewInvoice?.invoiceNumber || ""}`} onClose={() => setPreviewInvoice(null)}>
        {previewInvoice && <InvoicePreview invoice={previewInvoice} onDownload={() => downloadInvoicePdf(previewInvoice)} />}
      </Modal>
      
      <Modal open={addOpen} title="Add Invoice" onClose={() => setAddOpen(false)}>
        <AddInvoiceForm
          bookings={bookings}
          onSubmit={async (values) => {
            await dispatch(invoiceActions.createOne(values)).unwrap();
            await dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
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
              await dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
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
              await dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
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
            await dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
            setSendTarget(null);
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
            await dispatch(invoiceActions.fetchAll(paymentStatusFilter ? { paymentStatus: paymentStatusFilter } : {}));
          }
          setDeleteTarget(null);
        }}
      />
      
      <ConfirmDialog
        open={bulkSendConfirmOpen}
        title="Send Invoices"
        prompt="Confirm Bulk Invoice Send"
        confirmLabel="Send"
        message={
          <div className="space-y-2">
            <p>
              {bulkSendIsSelected
                ? `Send ${bulkSendInvoiceCount} selected invoice${bulkSendInvoiceCount > 1 ? "s" : ""}?`
                : `Send all ${bulkSendInvoiceCount} invoice${bulkSendInvoiceCount > 1 ? "s" : ""} to respective clients?`}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Each client will receive their invoice(s) via email.
            </p>
          </div>
        }
        onCancel={() => setBulkSendConfirmOpen(false)}
        onConfirm={proceedWithBulkSend}
      />
    </div>
  );

  async function downloadInvoicePdf(invoice: any) {
    const result = await dispatch(invoiceActions.downloadPdf(invoice._id)).unwrap();
    downloadBlob(result.blob, `${invoice.invoiceNumber || "invoice"}.pdf`);
    showToast({ type: "success", title: "Download ready", message: "Invoice PDF downloaded successfully." });
  }

  async function exportBookingPdf(invoice: any) {
    const bookingId = invoice.bookingId || invoice.booking?.bookingId || invoice.booking?._id;
    const result = await dispatch(invoiceActions.downloadBookingPdf({
      bookingId,
      payload: {
        paymentStatus: paymentStatusFilter || undefined,
        projectType: projectTypeFilter || undefined,
        from: effectiveDateRange.from ? formatDateInputValue(effectiveDateRange.from) : undefined,
        to: effectiveDateRange.to ? formatDateInputValue(effectiveDateRange.to) : undefined,
        bookingIds: [bookingId]
      }
    })).unwrap();
    downloadBlob(result.blob, `booking-${bookingId || "invoice-pack"}.pdf`);
    showToast({ type: "success", title: "Download ready", message: "Booking PDF downloaded successfully." });
  }

  function buildExportPayload(format: "xlsx" | "pdf") {
    return {
      format,
      paymentStatus: paymentStatusFilter || undefined,
      projectType: projectTypeFilter || undefined,
      from: effectiveDateRange.from ? formatDateInputValue(effectiveDateRange.from) : undefined,
      to: effectiveDateRange.to ? formatDateInputValue(effectiveDateRange.to) : undefined,
      invoiceIds: selectedActionInvoiceIds.length ? selectedActionInvoiceIds : undefined,
      bookingIds: selectedBookingIds.length ? selectedBookingIds : undefined
    };
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label="Invoice" value={invoice.invoiceNumber} />
        <InfoCard label="Client" value={invoice.clientName || invoice.booking?.businessUnit || "-"} />
        <InfoCard label="Passenger" value={invoice.booking?.passengerName || "-"} />
        <InfoCard label="Trip" value={invoice.trip?.tripNumber || "-"} />
        <InfoCard label="Project Type" value={getInvoiceProjectType(invoice)} />
        <InfoCard label="Billing Address" value={invoice.billingAddress || invoice.trip?.billingAddress || invoice.booking?.reportingAddress || invoice.booking?.dropAddress || "-"} />
        <InfoCard label="KM OUT" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.kmOut} onChange={(event) => updateField("kmOut", event.target.value)} />} />
        <InfoCard label="KM IN" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.kmIn} onChange={(event) => updateField("kmIn", event.target.value)} />} />
        <InfoCard label="Time OUT" value={<input className="input mt-1 text-sm" type="datetime-local" value={form.timeOut} onChange={(event) => updateField("timeOut", event.target.value)} />} />
        <InfoCard label="Time IN" value={<input className="input mt-1 text-sm" type="datetime-local" value={form.timeIn} onChange={(event) => updateField("timeIn", event.target.value)} />} />
        <InfoCard label="Project Type" value={<select className="input mt-1 text-sm" value={form.projectType} onChange={(event) => updateField("projectType", event.target.value as InvoiceProjectType)}><option value="Process">Process</option><option value="Management">Management</option></select>} />
        <InfoCard label="Address" value={<input className="input mt-1 text-sm" type="text" value={form.billingAddress} onChange={(event) => updateField("billingAddress", event.target.value)} placeholder="Enter address" />} />
        <InfoCard label="Vehicle Charges Per KM" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.vehicleChargesPerKm} onChange={(event) => updateField("vehicleChargesPerKm", event.target.value)} />} />
        <InfoCard label="Trip Fare" value={<input className="input mt-1 bg-slate-50 font-semibold text-sm" type="number" value={String(computed.tripFare)} readOnly />} />
        <InfoCard label="Toll Charges" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.tollCharges} onChange={(event) => updateField("tollCharges", event.target.value)} />} />
        <InfoCard label="Parking Charges" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.parkingCharges} onChange={(event) => updateField("parkingCharges", event.target.value)} />} />
        <InfoCard label="Extras / Other Charges" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.extraCharges} onChange={(event) => updateField("extraCharges", event.target.value)} />} />
        <InfoCard label="GST (%)" value={<input className="input mt-1 text-sm" type="number" step="any" min="0" inputMode="decimal" value={form.gstCharges} onChange={(event) => updateField("gstCharges", event.target.value)} />} />
        <InfoCard label="Payment Status" value={<PaymentStatusBadge invoice={buildPreviewInvoice(invoice, form)} />} />
        <InfoCard label="Balance" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.remainingAmount.toLocaleString()}</p>} />
        <InfoCard label="Total KM" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{computed.totalKm.toLocaleString()}</p>} />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setForm(invoiceDutySlipDefaults(invoice))}>Reset</button>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={submit}>Update Invoice</button>
      </div>
    </div>
  );
}

function BookingInvoiceGroups({
  groups,
  loading,
  loadingMessage,
  selectedGroupIds,
  selectedInvoiceIds,
  expandedGroupIds,
  onToggleGroup,
  onToggleGroupAll,
  onToggleExpand,
  onToggleInvoice,
  onToggleGroupInvoices,
  onBookingPdf,
  onBulkSend,
  renderInvoiceActions
}: {
  groups: any[];
  loading?: boolean;
  loadingMessage?: string;
  selectedGroupIds: string[];
  selectedInvoiceIds: string[];
  expandedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  onToggleGroupAll: (ids: string[]) => void;
  onToggleExpand: (id: string) => void;
  onToggleInvoice: (id: string) => void;
  onToggleGroupInvoices: (group: any, ids: string[]) => void;
  onBookingPdf: (invoice: any) => void;
  onBulkSend: (group: any) => void;
  renderInvoiceActions: (invoice: any) => ReactNode;
}) {
  if (loading) return <LoadingSkeleton message={loadingMessage} />;
  if (!groups.length) return <EmptyState />;

  const groupIds = groups.map((group) => group._id);
  const allGroupsSelected = groupIds.length > 0 && groupIds.every((id) => selectedGroupIds.includes(id));

  return (
    <div className="space-y-2 min-w-[280px]">
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-red-950/35 dark:bg-[rgb(23,23,25)] dark:text-slate-200">
        <input
          type="checkbox"
          aria-label="Select all booking groups"
          checked={allGroupsSelected}
          onChange={() => onToggleGroupAll(allGroupsSelected ? [] : groupIds)}
        />
        <span>Select all booking groups</span>
      </div>
      {groups.map((group) => {
        const recentInvoice = group.invoices[0];
        const otherInvoices = group.invoices.slice(1);
        const isExpanded = expandedGroupIds.includes(group._id);
        const childSelectedIds = Array.from(new Set([
          ...selectedInvoiceIds,
          ...(selectedGroupIds.includes(group._id) ? group.invoiceIds : [])
        ]));

        return (
          <div key={group._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-red-950/35 dark:bg-[#101012]">
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-3 p-3 text-sm text-slate-700 dark:text-slate-200 items-center">
              <input
                type="checkbox"
                aria-label="Select booking group"
                checked={selectedGroupIds.includes(group._id)}
                onChange={() => onToggleGroup(group._id)}
              />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Cab Request Number</p>
                <p className="font-semibold text-slate-950 dark:text-white text-sm">{group.cabRequestNumber}</p>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {group.invoiceCount} {group.invoiceCount === 1 ? "invoice" : "invoices"}
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-2 col-span-3 md:col-span-1 md:justify-end">
                {otherInvoices.length > 0 && (
                  <button type="button" className="btn-secondary px-2 py-1.5 text-sm" onClick={() => onToggleExpand(group._id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="hidden xs:inline">{isExpanded?"Hide":"View"} ({otherInvoices.length})</span>
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-slate-100 p-2 dark:border-red-950/25 overflow-x-auto">
              <div className="min-w-[500px] md:min-w-0">
                <DataTable
                  rows={isExpanded ? group.invoices : [recentInvoice]}
                  selectable
                  selectedIds={childSelectedIds}
                  onToggleRow={onToggleInvoice}
                  onToggleAll={(ids) => onToggleGroupInvoices(group, ids)}
                  columns={[
                    { key: "invoiceNumber", header: "Invoice" },
                    { key: "createdAt", header: "Date", render: (r) => formatDisplayDate(r.invoiceDate || r.createdAt) },
                    { key: "clientName", header: "Client" },
                    { key: "paymentStatus", header: "Payment", render: (r) => <PaymentStatusBadge invoice={r} /> },
                    { key: "finalAmount", header: "Total", render: (r) => `₹ ${Number(r.finalAmount || 0).toLocaleString()}` },
                    { key: "remainingAmount", header: "Balance", render: (r) => `₹ ${Number(remainingAmount(r)).toLocaleString()}` }
                  ]}
                  actionCount={7}
                  actions={renderInvoiceActions}
                />
              </div>
            </div>
          </div>
        );
      })}
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
  timeOut: string;
  timeIn: string;
  closingKm: string;
  closingTime: string;
  closingLocation: string;
  vehicleChargesPerKm: string;
  tollCharges: string;
  parkingCharges: string;
  extraCharges: string;
  gstPercent: string;
  remarks: string;
};

function AddInvoiceForm({ bookings, onSubmit }: { bookings: any[]; onSubmit: (payload: any) => Promise<void> | void }) {
  const [form, setForm] = useState<AddInvoiceFormState>({
    bookingId: "",
    clientName: "",
    clientEmail: "",
    projectType: "Process",
    billingAddress: "",
    kmOut: "",
    kmIn: "",
    timeOut: "",
    timeIn: "",
    closingKm: "",
    closingTime: "",
    closingLocation: "",
    vehicleChargesPerKm: "",
    tollCharges: "0",
    parkingCharges: "0",
    extraCharges: "0",
    gstPercent: "18",
    remarks: ""
  });
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPickerOpen, setBookingPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const kmOut = normalizeNumber(form.kmOut);
  const kmIn = normalizeNumber(form.kmIn);
  const vehicleChargesPerKm = normalizeNumber(form.vehicleChargesPerKm) ?? 0;
  const totalKm = kmOut !== null && kmIn !== null ? Math.max(0, kmIn - kmOut) : 0;
  const tripFare = Math.round(totalKm * vehicleChargesPerKm);
  const tollCharges = normalizeNumber(form.tollCharges) ?? 0;
  const parkingCharges = normalizeNumber(form.parkingCharges) ?? 0;
  const extraCharges = normalizeNumber(form.extraCharges) ?? 0;
  const gstPercent = normalizeNumber(form.gstPercent) ?? 0;
  const subtotal = tripFare + tollCharges + parkingCharges + extraCharges;
  const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;
  const matchedBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    const source = Array.isArray(bookings) ? bookings : [];
    if (!query) return source.slice(0, 6);
    return source.filter((booking) => [
      booking.bookingId,
      booking.cabRequestNumber,
      booking.passengerName,
      booking.businessUnit
    ].some((value) => String(value || "").toLowerCase().includes(query))).slice(0, 8);
  }, [bookingSearch, bookings]);

  function updateField(field: keyof AddInvoiceFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function selectBooking(booking: any) {
    setForm((current) => ({
      ...current,
      bookingId: String(booking._id || booking.id || booking.bookingId || ""),
      clientName: booking.businessUnit || booking.passengerName || current.clientName,
      clientEmail: booking.senderEmail || current.clientEmail,
      billingAddress: booking.reportingAddress || booking.dropAddress || current.billingAddress,
      timeOut: booking.travelStartDate ? toDatetimeLocal(booking.travelStartDate) : current.timeOut,
      timeIn: booking.travelEndDate ? toDatetimeLocal(booking.travelEndDate) : current.timeIn
    }));
    setBookingSearch(`${booking.bookingId || booking.cabRequestNumber || booking._id} - ${booking.passengerName || booking.businessUnit || "Booking"}`);
    setBookingPickerOpen(false);
    setErrors((current) => ({ ...current, bookingId: "" }));
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
        timeOut: form.timeOut || undefined,
        timeIn: form.timeIn || undefined,
        closingKm: form.closingKm ? Number(form.closingKm) : undefined,
        closingTime: form.closingTime || undefined,
        closingLocation: form.closingLocation.trim() || undefined,
        tollCharges,
        parkingCharges,
        extraCharges,
        ratePerKm: vehicleChargesPerKm,
        gstPercent,
        remarks: form.remarks.trim() || undefined
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={submit}>
      <div className="sm:col-span-2">
        <RequiredLabel>Search Booking ID</RequiredLabel>
        <input
          className="input text-sm"
          value={bookingSearch}
          onFocus={() => setBookingPickerOpen(true)}
          onChange={(event) => {
            setBookingSearch(event.target.value);
            setBookingPickerOpen(true);
            setForm((current) => ({ ...current, bookingId: "" }));
          }}
          placeholder="Search booking ID, cab request, passenger..."
        />
        {errors.bookingId && <span className="mt-1 block text-xs text-red-500">{errors.bookingId}</span>}
        {bookingPickerOpen && matchedBookings.length > 0 && (
        <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-brand-100 bg-white p-2 dark:border-red-950/40 dark:bg-[#111114]">
          {matchedBookings.map((booking) => (
            <button
              key={booking._id || booking.id || booking.bookingId}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-red-950/20 ${String(form.bookingId) === String(booking._id || booking.id) ? "bg-brand-50 text-brand-700 dark:bg-red-950/25 dark:text-brand-100" : ""}`}
              onClick={() => selectBooking(booking)}
            >
              <span className="font-semibold">{booking.bookingId || booking.cabRequestNumber || booking._id}</span>
              <span className="ml-2 text-slate-500">{booking.passengerName || booking.businessUnit || "-"}</span>
            </button>
          ))}
        </div>
        )}
      </div>
      <InvoiceInput label="Client Name" value={form.clientName} error={errors.clientName} onChange={(value) => updateField("clientName", value)} />
      <InvoiceInput label="Client Email" type="email" value={form.clientEmail} error={errors.clientEmail} onChange={(value) => updateField("clientEmail", value)} />
      <label>
        <RequiredLabel>Project Type</RequiredLabel>
        <select className="input text-sm" value={form.projectType} onChange={(event) => updateField("projectType", event.target.value as InvoiceProjectType)}>
          <option value="Process">Process</option>
          <option value="Management">Management</option>
        </select>
      </label>
      <InvoiceInput label="Billing Address" value={form.billingAddress} error={errors.billingAddress} onChange={(value) => updateField("billingAddress", value)} full />
      <InvoiceInput label="KM Out" type="number" value={form.kmOut} error={errors.kmOut} onChange={(value) => updateField("kmOut", value)} />
      <InvoiceInput label="KM In" type="number" value={form.kmIn} error={errors.kmIn} onChange={(value) => updateField("kmIn", value)} />
      <ComputedField label="Total KM" value={totalKm.toLocaleString()} />
      <InvoiceInput label="Time Out" type="datetime-local" value={form.timeOut} error={errors.timeOut} onChange={(value) => updateField("timeOut", value)} />
      <InvoiceInput label="Time In" type="datetime-local" value={form.timeIn} error={errors.timeIn} onChange={(value) => updateField("timeIn", value)} />
      <InvoiceInput label="Closing KM" type="number" value={form.closingKm} error={errors.closingKm} onChange={(value) => updateField("closingKm", value)} requiredLabel={false} />
      <InvoiceInput label="Closing Time" type="datetime-local" value={form.closingTime} error={errors.closingTime} onChange={(value) => updateField("closingTime", value)} requiredLabel={false} />
      <InvoiceInput label="Closing Location" value={form.closingLocation} error={errors.closingLocation} onChange={(value) => updateField("closingLocation", value)} />
      <InvoiceInput label="Vehicle Charges Per KM" type="number" value={form.vehicleChargesPerKm} error={errors.vehicleChargesPerKm} onChange={(value) => updateField("vehicleChargesPerKm", value)} />
      <InvoiceInput label="Trip Fare" type="number" value={String(tripFare)} readOnly />
      <InvoiceInput label="Toll Charges" type="number" value={form.tollCharges} error={errors.tollCharges} onChange={(value) => updateField("tollCharges", value)} />
      <InvoiceInput label="Parking Charges" type="number" value={form.parkingCharges} error={errors.parkingCharges} onChange={(value) => updateField("parkingCharges", value)} />
      <InvoiceInput label="Extras / Other Charges" type="number" value={form.extraCharges} error={errors.extraCharges} onChange={(value) => updateField("extraCharges", value)} />
      <ComputedField label="Subtotal Without GST" value={`₹ ${subtotal.toLocaleString()}`} />
      <InvoiceInput label="GST (%)" type="number" value={form.gstPercent} error={errors.gstPercent} onChange={(value) => updateField("gstPercent", value)} />
      <ComputedField label="GST Amount" value={`₹ ${gstAmount.toLocaleString()}`} />
      <ComputedField label="Total Amount" value={`₹ ${totalAmount.toLocaleString()}`} />
      <InvoiceInput label="Remarks" value={form.remarks} error={errors.remarks} onChange={(value) => updateField("remarks", value)} full requiredLabel={false} />
      <div className="sm:col-span-2">
        <button className="btn-primary w-full sm:w-auto" disabled={submitting}>{submitting ? "Creating..." : "Create Invoice"}</button>
      </div>
    </form>
  );
}

function InvoiceInput({ label, value, error, onChange, type = "text", full = false, readOnly = false, requiredLabel = true }: { label: string; value: string; error?: string; onChange?: (value: string) => void; type?: string; full?: boolean; readOnly?: boolean; requiredLabel?: boolean }) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      {requiredLabel ? <RequiredLabel>{label}</RequiredLabel> : <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{label}</span>}
      <input
        className="input text-sm"
        type={type}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? 0 : undefined}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(event) => {
          if (!readOnly && onChange) onChange(event.target.value);
        }}
        readOnly={readOnly}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

function ComputedField({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input className="input bg-slate-50 font-semibold text-slate-700 dark:bg-slate-900/70 dark:text-slate-100 text-sm" value={value} readOnly />
    </label>
  );
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{children}<span className="ml-0.5 text-brand-600">*</span></span>;
}

function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function buildInvoiceGroups(rows: any[]) {
  const groups = new Map<string, any>();
  rows.forEach((invoice) => {
    const bookingId = String(invoice.bookingId || invoice.booking?.bookingId || invoice.booking?._id || "unknown");
    const existing = groups.get(bookingId) || {
      _id: bookingId,
      bookingId,
      cabRequestNumber: invoice.booking?.cabRequestNumber || invoice.cabRequestNumber || "-",
      passengerName: invoice.booking?.passengerName || invoice.passengerName || invoice.clientName || "-",
      invoices: [],
      invoiceIds: [],
      invoiceCount: 0,
      totalAmount: 0,
      balanceAmount: 0
    };
    existing.invoices.push(invoice);
    existing.invoiceIds.push(String(invoice._id));
    existing.invoiceCount += 1;
    existing.totalAmount += Number(invoice.finalAmount || 0);
    existing.balanceAmount += Number(remainingAmount(invoice));
    groups.set(bookingId, existing);
  });
  return Array.from(groups.values()).map((group) => ({
    ...group,
    invoices: [...group.invoices].sort((a, b) => getInvoiceTime(b) - getInvoiceTime(a)),
    invoiceIds: [...group.invoices]
      .sort((a, b) => getInvoiceTime(b) - getInvoiceTime(a))
      .map((invoice) => String(invoice._id))
  }));
}

function getInvoiceTime(invoice: any) {
  const value = invoice.invoiceDate || invoice.createdAt || invoice.updatedAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
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
  const required: Array<keyof AddInvoiceFormState> = ["bookingId", "clientName", "clientEmail", "billingAddress", "kmOut", "kmIn", "timeOut", "timeIn", "closingLocation", "vehicleChargesPerKm", "tollCharges", "parkingCharges", "extraCharges", "gstPercent"];
  for (const field of required) {
    if (!String(form[field] ?? "").trim()) errors[field] = "Required";
  }
  if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail)) errors.clientEmail = "Enter a valid email address.";
  for (const field of ["kmOut", "kmIn", "vehicleChargesPerKm", "tollCharges", "parkingCharges", "extraCharges", "gstPercent"] as const) {
    const value = normalizeNumber(form[field]);
    if (value === null || value < 0) errors[field] = "Enter a number 0 or greater.";
  }
  if (String(form.closingKm).trim()) {
    const closingKmValue = normalizeNumber(form.closingKm);
    if (closingKmValue === null || closingKmValue < 0) errors.closingKm = "Enter a number 0 or greater.";
  }
  if (normalizeNumber(form.kmOut) !== null && normalizeNumber(form.kmIn) !== null && totalKm <= 0) {
    errors.kmIn = "KM In must be greater than KM Out";
  }
  return errors;
}

function InvoicePaymentStatusEditor({ invoice, onSubmit }: { invoice: any; onSubmit: (payload: any) => Promise<void> | void }) {
  const [form, setForm] = useState<InvoicePaymentState>(() => invoicePaymentDefaults(invoice));
  const [confirmPendingOpen, setConfirmPendingOpen] = useState(false);

  useEffect(() => {
    setForm(invoicePaymentDefaults(invoice));
  }, [invoice]);

  const computed = useMemo(() => calculatePaymentTotals(invoice, form), [invoice, form]);
  const currentStatus = invoice.paymentStatus === "Paid" || Number(invoice.remainingAmount ?? invoice.balanceAmount ?? 0) === 0
    ? "Paid"
    : "Pending";
  const isPendingSelection = form.paymentStatus === "Pending";
  const isDowngradeToPending = currentStatus === "Paid" && isPendingSelection;

  function updateField(field: keyof InvoicePaymentState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    await onSubmit(buildPaymentUpdatePayload(invoice, form));
  }

  function handleSubmit() {
    if (isDowngradeToPending) {
      setConfirmPendingOpen(true);
      return;
    }
    submit();
  }

  async function confirmPending() {
    setConfirmPendingOpen(false);
    await submit();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Invoice" value={invoice.invoiceNumber} />
          <InfoCard label="Client" value={invoice.clientName || invoice.booking?.businessUnit || "-"} />
          <InfoCard label="Current Payment Status" value={<PaymentStatusBadge invoice={invoice} />} />
          <InfoCard
            label="Payment Status"
            value={
              <select
                className="input mt-1 text-sm"
                value={form.paymentStatus}
                onChange={(event) => updateField("paymentStatus", event.target.value as InvoicePaymentState["paymentStatus"])}
              >
                {["Pending", "Paid"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            }
          />
          <InfoCard
            label="Payment Type"
            value={
              <select
                className="input mt-1 text-sm"
                value={form.paymentType}
                disabled={isPendingSelection}
                onChange={(event) => updateField("paymentType", event.target.value as InvoicePaymentState["paymentType"])}
              >
                {["Cash", "UPI", "Cheque", "NEFT", "RTGS", "Other"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            }
          />
          <InfoCard
            label="Remark"
            value={
              <textarea
                className="input mt-1 min-h-24 text-sm"
                value={form.remark}
                disabled={isPendingSelection}
                onChange={(event) => updateField("remark", event.target.value)}
              />
            }
          />
          {isPendingSelection && (
            <div className="sm:col-span-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900 dark:border-orange-950/40 dark:bg-orange-950/10 dark:text-orange-100">
              Marking this invoice Pending disables payment type and remark, and clears the payment details on save.
            </div>
          )}
          <InfoCard label="Balance" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.remainingAmount.toLocaleString()}</p>} />
          <InfoCard label="Paid Amount" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {computed.paidAmount.toLocaleString()}</p>} />
          <InfoCard label="Final Amount" value={<p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">₹ {Number(invoice.finalAmount || 0).toLocaleString()}</p>} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setForm(invoicePaymentDefaults(invoice))}>Reset</button>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={handleSubmit}>Update Payment Status</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmPendingOpen}
        title="Confirm Pending Payment"
        prompt="Mark invoice as Pending?"
        confirmLabel="Yes, mark Pending"
        cancelLabel="Cancel"
        message={
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <p>This invoice is currently marked as Paid.</p>
            <p>Marking it Pending will clear the payment type and remark, and update the payment status accordingly.</p>
          </div>
        }
        onCancel={() => setConfirmPendingOpen(false)}
        onConfirm={confirmPending}
      />
    </>
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
  const ratePerKm = normalizeNumber(form.vehicleChargesPerKm) ?? Number(invoice.trip?.vehicle?.rate_per_km || invoice.trip?.vehicle?.ratePerKm || 22);
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
    vehicleChargesPerKm: invoice.trip?.vehicle?.rate_per_km ? String(invoice.trip.vehicle.rate_per_km) : invoice.trip?.vehicle?.ratePerKm ? String(invoice.trip.vehicle.ratePerKm) : "",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Unique Carz</h3>
            <p className="text-sm text-slate-500">Tax invoice preview</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">{formatDisplayDate(invoice.createdAt)}</p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="min-w-[300px]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-100 text-sm last:border-b-0 dark:border-slate-800">
              <div className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">{label}</div>
              <div className="px-3 py-2 text-slate-900 dark:text-white break-words">{value}</div>
            </div>
          ))}
        </div>
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
    ["Extras / Other Charges", `₹ ${Number(invoice.extraCharges ?? trip.extraCharges ?? 0).toLocaleString()}`],
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
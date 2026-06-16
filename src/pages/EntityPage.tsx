import { Eye, Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { formatDisplayDate, shouldFormatAsDate } from "../utils/formatDate";

export function EntityPage({ title, subtitle, stateKey, actions, columns, fields, schema, defaults, extraActions, canEditRow = () => true, lockedLabel = "Locked", statusOptions = [], filterKey = "status", filterLabel = "Status", hiddenViewKeys = [], searchable = false, searchPlaceholder = "Search" }: {
  title: string;
  subtitle: string;
  stateKey: string;
  actions: any;
  columns: any[];
  fields: any[];
  schema?: any | ((isEditing: boolean) => any);
  defaults?: Record<string, any>;
  extraActions?: ReactNode;
  canEditRow?: (row: any) => boolean;
  lockedLabel?: string;
  statusOptions?: string[];
  filterKey?: string;
  filterLabel?: string;
  hiddenViewKeys?: string[];
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [viewRow, setViewRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const state = useAppSelector((store) => (store as any)[stateKey]);
  useEffect(() => { dispatch(actions.fetchAll(status ? { [filterKey]: status } : {})); }, [dispatch, actions, filterKey, status]);
  const visibleRows = search
    ? state.items.filter((row: any) => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
    : state.items;
  const formSchema = typeof schema === "function" ? schema(Boolean(editingRow)) : (schema || z.object(Object.fromEntries(fields.map((field) => [
    field.name,
    createFieldSchema(field)
  ]))));
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <input className="input w-40" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
          )}
          {statusOptions.length > 0 && (
            <select className="input w-36" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All {filterLabel}</option>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          )}
          {extraActions}
          <button className="btn-primary" onClick={() => { setEditingRow(null); setFormError(null); setOpen(true); }}><Plus className="h-4 w-4" />Add</button>
        </div>
      </div>
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-200">
          {state.error}
        </div>
      )}
      <div className="panel relative p-2">
        {state.loading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm dark:bg-black/45">
            <div className="rounded-2xl border border-brand-100 bg-white px-5 py-4 text-center shadow-2xl shadow-brand-600/15 dark:border-red-950/45 dark:bg-[#111114]">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 dark:text-brand-200" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Syncing data...</p>
            </div>
          </div>
        )}
        <DataTable
          loading={state.loading}
          rows={visibleRows}
          columns={columns}
          actionCount={3}
          actions={(row) => {
            const canEdit = canEditRow(row);
            if (!canEdit) {
              return (
                <div className="flex min-w-40 flex-col gap-2">
                  <button className="btn-secondary w-full justify-start p-2" onClick={() => setViewRow(row)} aria-label="View">
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Lock className="h-3 w-3" />
                    {lockedLabel}
                  </span>
                </div>
              );
            }

            return (
              <div className="flex min-w-40 flex-col gap-2">
                <button className="btn-secondary w-full justify-start p-2" onClick={() => setViewRow(row)} aria-label="View">
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                <button className="btn-secondary w-full justify-start p-2" onClick={() => { setEditingRow(row); setFormError(null); setOpen(true); }} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button className="btn-secondary w-full justify-start p-2 text-red-600 hover:text-red-700" onClick={() => setDeleteRow(row)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            );
          }}
        />
      </div>
      <Modal open={open} title={`${editingRow ? "Edit" : "Add"} ${title}`} onClose={() => { setOpen(false); setEditingRow(null); setFormError(null); }}>
        {formError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-950/50 dark:bg-red-950/30 dark:text-red-200">
            {formError}
          </div>
        )}
        <EntityForm
          fields={fields}
          schema={formSchema}
          defaults={editingRow || defaults}
          submitLabel={editingRow ? "Update" : "Save"}
          onSubmit={async (values) => {
            try {
              if (editingRow) {
                await dispatch(actions.updateOne({ id: editingRow._id, payload: values })).unwrap();
              } else {
                await dispatch(actions.createOne(values)).unwrap();
              }
              await dispatch(actions.fetchAll(status ? { [filterKey]: status } : {}));
              setOpen(false);
              setEditingRow(null);
              setFormError(null);
            } catch (error) {
              setFormError(getErrorMessage(error));
            }
          }}
        />
      </Modal>
          <Modal open={Boolean(viewRow)} title={`View ${title}`} onClose={() => setViewRow(null)}>
        {viewRow && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Object.entries(viewRow).filter(([key]) => !["_id", "__v", ...hiddenViewKeys].includes(key)).map(([key, value]) => (
              <div key={key} className="rounded-md border border-slate-200 p-2.5 dark:border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400">{key}</p>
                <div className="mt-1 text-[13px] text-slate-900 dark:text-white">{formatValue(key, value)}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteRow)}
        title={`Delete ${title}`}
        message={`This will permanently delete ${deleteRow?.name || deleteRow?.invoiceNumber || deleteRow?.bookingId || deleteRow?.tripNumber || "this record"}.`}
        onCancel={() => setDeleteRow(null)}
        onConfirm={async () => {
          if (deleteRow?._id) {
            await dispatch(actions.deleteOne(deleteRow._id)).unwrap();
          }
          await dispatch(actions.fetchAll(status ? { [filterKey]: status } : {}));
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

function formatValue(key: string, value: any) {
  if (value === null || value === undefined || value === "") return "-";
  const normalizedKey = key.toLowerCase();
  const imageLike = normalizedKey.includes("photo") || normalizedKey.includes("image") || normalizedKey.includes("screenshot");
  if (imageLike && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="block">
        <img src={value} alt={key} className="max-h-36 rounded-md border border-slate-200 object-contain dark:border-slate-800" />
      </a>
    );
  }
  if (shouldFormatAsDate(key, value)) return formatDisplayDate(value);
  if (typeof value === "object") return value.name || value.driverName || value.registration_number || value.registrationNumber || value.bookingId || JSON.stringify(value);
  return String(value);
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function createFieldSchema(field: any) {
  const requiredMessage = "This field is required.";

  if (field.type === "number") {
    const min = field.min ?? 0;
    const numberSchema = z.preprocess(
      (value) => value === "" || value === null || value === undefined || (typeof value === "number" && Number.isNaN(value)) ? undefined : value,
      field.required === false
        ? z.coerce.number({ invalid_type_error: "Please enter a valid number." }).min(min, `Minimum value is ${min}.`).optional()
        : z.coerce.number({ required_error: requiredMessage, invalid_type_error: "Please enter a valid number." }).min(min, `Minimum value is ${min}.`)
    );
    return numberSchema;
  }

  if (field.type === "file") {
    return z.any().optional();
  }

  const stringInput = z.preprocess((value) => value === null || value === undefined ? "" : value, z.string({ invalid_type_error: requiredMessage }));
  return field.required === false
    ? stringInput.optional()
    : stringInput.refine((value) => value.trim().length > 0, requiredMessage);
}


import { Eye, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EntityForm } from "../components/forms/EntityForm";
import { Modal } from "../components/common/Modal";
import { DataTable } from "../components/tables/DataTable";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

export function EntityPage({ title, subtitle, stateKey, actions, columns, fields, schema, defaults, extraActions, canEditRow = () => true, lockedLabel = "Locked", statusOptions = [], filterKey = "status", filterLabel = "Status", hiddenViewKeys = [], searchable = false, searchPlaceholder = "Search" }: {
  title: string;
  subtitle: string;
  stateKey: string;
  actions: any;
  columns: any[];
  fields: any[];
  schema?: any;
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
  const state = useAppSelector((store) => (store as any)[stateKey]);
  useEffect(() => { dispatch(actions.fetchAll(status ? { [filterKey]: status } : {})); }, [dispatch, actions, filterKey, status]);
  const visibleRows = search
    ? state.items.filter((row: any) => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
    : state.items;
  const formSchema = schema || z.object(Object.fromEntries(fields.map((field) => [
    field.name,
    field.type === "number"
      ? z.coerce.number().min(field.min ?? 0)
      : field.type === "file"
        ? z.any().optional()
        : z.string().min(field.required === false ? 0 : 1, "Required")
  ])));
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
          <button className="btn-primary" onClick={() => { setEditingRow(null); setOpen(true); }}><Plus className="h-4 w-4" />Add</button>
        </div>
      </div>
      <div className="panel p-2">
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
                <button className="btn-secondary w-full justify-start p-2" onClick={() => { setEditingRow(row); setOpen(true); }} aria-label="Edit">
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
      <Modal open={open} title={`${editingRow ? "Edit" : "Add"} ${title}`} onClose={() => { setOpen(false); setEditingRow(null); }}>
        <EntityForm
          fields={fields}
          schema={formSchema}
          defaults={editingRow || defaults}
          submitLabel={editingRow ? "Update" : "Save"}
          onSubmit={async (values) => {
            if (editingRow) {
              await dispatch(actions.updateOne({ id: editingRow._id, payload: values }));
            } else {
              await dispatch(actions.createOne(values));
            }
            setOpen(false);
            setEditingRow(null);
          }}
        />
      </Modal>
      <Modal open={Boolean(viewRow)} title={`View ${title}`} onClose={() => setViewRow(null)}>
        {viewRow && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Object.entries(viewRow).filter(([key]) => !["_id", "__v", ...hiddenViewKeys].includes(key)).map(([key, value]) => (
              <div key={key} className="rounded-md border border-slate-200 p-2.5 dark:border-slate-800">
                <p className="text-[11px] font-semibold uppercase text-slate-400">{key}</p>
                <div className="mt-1 text-[13px] text-slate-900 dark:text-white">{formatValue(value)}</div>
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
            await dispatch(actions.deleteOne(deleteRow._id));
          }
          setDeleteRow(null);
        }}
      />
    </div>
  );
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && value.startsWith("data:image/")) {
    return <img src={value} alt="Uploaded document" className="max-h-36 rounded-md border border-slate-200 object-contain dark:border-slate-800" />;
  }
  if (typeof value === "object") return value.name || value.driverName || value.registrationNumber || value.bookingId || JSON.stringify(value);
  return String(value);
}


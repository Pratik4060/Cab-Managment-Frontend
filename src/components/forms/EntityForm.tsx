import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FieldOption = string | { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type?: string;
  accept?: string;
  placeholder?: string;
  options?: FieldOption[];
  optionsBy?: Record<string, FieldOption[]>;
  dependsOn?: string;
  full?: boolean;
  required?: boolean;
  step?: string;
  disabled?: boolean;
  valueType?: "boolean";
};

export function EntityForm({ schema, fields, defaults = {}, onSubmit, submitLabel = "Save" }: {
  schema: any;
  fields: Field[];
  defaults?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  submitLabel?: string;
}) {
  const formDefaults = {
    ...defaults,
    ...Object.fromEntries(fields.map((field) => {
      const value = defaults[field.name];
      if (field.type === "date") {
        return [field.name, value ? formatDateDefault(value) : ""];
      }
      if (field.type === "datetime-local") {
        return [field.name, value ? formatDateTimeDefault(value) : ""];
      }
      if (field.valueType === "boolean" && value !== undefined && value !== null) {
        return [field.name, String(value)];
      }
      return [field.name, value === null || value === undefined ? "" : value];
    }))
  };
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Record<string, any>>({ resolver: zodResolver(schema), defaultValues: formDefaults });

  async function submitWithFiles(values: Record<string, any>) {
    const normalized = { ...values };
    for (const field of fields) {
      if (field.type === "file") {
        const file = getSelectedFile(values[field.name]);
        if (file) {
          normalized[field.name] = file;
          continue;
        }

        const existingValue = defaults[field.name];
        normalized[field.name] = typeof existingValue === "string" ? existingValue : "";
      }
      if (field.valueType === "boolean") {
        normalized[field.name] = values[field.name] === true || values[field.name] === "true";
      }
      if (field.required === false && (normalized[field.name] === "" || normalized[field.name] === null || normalized[field.name] === undefined)) {
        delete normalized[field.name];
      }
    }
    await onSubmit(normalized);
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit(submitWithFiles)}>
      {fields.map((field) => (
        <label key={field.name} className={field.full ? "sm:col-span-2" : ""}>
          <span className="mb-0.5 block text-[13px] font-medium text-slate-700 dark:text-slate-200">
            {field.label}
            {field.required !== false && !field.disabled && <span className="ml-0.5 text-brand-600">*</span>}
          </span>
          {field.type === "select" ? (
            <select className="input" {...register(field.name as any)}>
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {(field.optionsBy && field.dependsOn ? field.optionsBy[watch(field.dependsOn)] || [] : field.options || []).map((option) => {
                const value = typeof option === "object" ? option.value : option;
                const label = typeof option === "object" ? option.label : option;
                return <option key={value} value={value}>{label}</option>;
              })}
            </select>
          ) : field.type === "file" ? (
            <div className="space-y-2">
              <input
                className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                type="file"
                accept={field.accept || "image/*"}
                {...register(field.name as any)}
              />
              <FilePreview value={watch(field.name) || defaults[field.name]} label={field.label} />
            </div>
          ) : (
            <input
              className="input"
              type={field.type || "text"}
              placeholder={field.placeholder}
              disabled={field.disabled}
              readOnly={field.disabled}
              step={field.type === "number" ? field.step || "any" : undefined}
              inputMode={field.type === "number" ? "decimal" : undefined}
              {...register(field.name as any, { valueAsNumber: field.type === "number" })}
            />
          )}
          {errors[field.name] && <span className="mt-1 block text-xs text-red-500">{errors[field.name]?.message as string}</span>}
        </label>
      ))}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={isSubmitting}>{submitLabel}</button>
      </div>
    </form>
  );
}

function FilePreview({ value, label }: { value: unknown; label: string }) {
  const file = getSelectedFile(value);
  const [objectUrl, setObjectUrl] = useState("");
  const source = typeof value === "string" ? value : objectUrl;

  useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!source) return null;

  return (
    <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-brand-100 px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-red-950/40 dark:text-brand-200 dark:hover:bg-red-950/20">
      View {label}
    </a>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDateDefault(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function formatDateTimeDefault(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function getSelectedFile(value: unknown) {
  if (value instanceof File) return value;
  if (value instanceof FileList) return value[0];
  if (Array.isArray(value)) {
    const first = value[0];
    if (first instanceof File) return first;
  }
  if (value && typeof value === "object" && "0" in value) {
    const first = (value as { 0?: unknown })[0];
    if (first instanceof File) return first;
  }
  return undefined;
}


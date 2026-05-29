import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type FieldOption = string | { value: string; label: string };
type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: FieldOption[];
  full?: boolean;
  required?: boolean;
  step?: string;
  disabled?: boolean;
};

export function EntityForm({ schema, fields, defaults = {}, onSubmit, submitLabel = "Save" }: {
  schema: any;
  fields: Field[];
  defaults?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  submitLabel?: string;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Record<string, any>>({ resolver: zodResolver(schema), defaultValues: defaults });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => (
        <label key={field.name} className={field.full ? "sm:col-span-2" : ""}>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
          {field.type === "select" ? (
            <select className="input" {...register(field.name as any)}>
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {(field.options || []).map((option) => {
                const value = typeof option === "object" ? option.value : option;
                const label = typeof option === "object" ? option.label : option;
                return <option key={value} value={value}>{label}</option>;
              })}
            </select>
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


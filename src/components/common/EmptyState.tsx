import { Inbox } from "lucide-react";

export function EmptyState({ title = "No records found", description = "Try changing filters or create a new record." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" />
      <p className="font-medium text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}


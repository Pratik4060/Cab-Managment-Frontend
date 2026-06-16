import { Inbox } from "lucide-react";

export function EmptyState({ title = "Data not available", description = "No API data is available for this section." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-10 text-center dark:border-red-950/45 dark:bg-[#101012]">
      <Inbox className="mb-3 h-8 w-8 text-slate-400 dark:text-brand-300" />
      <p className="font-medium text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}


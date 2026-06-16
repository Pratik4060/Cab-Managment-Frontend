export function LoadingSkeleton({ rows = 4, message = "Loading data..." }: { rows?: number; message?: string } = {}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-red-950/40 dark:bg-[#111114] dark:text-slate-100">
        {message}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-slate-200 dark:bg-[#18181b]" />
      ))}
    </div>
  );  
}


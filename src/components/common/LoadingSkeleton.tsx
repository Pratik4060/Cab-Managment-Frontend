export function LoadingSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-slate-200 dark:bg-[#18181b]" />
      ))}
    </div>
  );
}


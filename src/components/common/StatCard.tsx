import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  tone?: "brand" | "green" | "amber";
};

export function StatCard({ icon: Icon, label, value, tone = "brand" }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value ?? 0}</p>
        </div>
        <div className={`rounded-md p-3 ${tone === "green" ? "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-200" : tone === "amber" ? "bg-zinc-100 text-brand-600 dark:bg-zinc-900 dark:text-brand-300" : "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-200"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}


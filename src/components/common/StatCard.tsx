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
        <div className={`rounded-md p-3 ${tone === "green" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950" : tone === "amber" ? "bg-amber-50 text-amber-600 dark:bg-amber-950" : "bg-brand-50 text-brand-600 dark:bg-brand-950/40"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}


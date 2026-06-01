import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  tone?: "brand" | "green" | "amber";
};

const toneStyles = {
  brand: {
    border: "border-l-brand-600 dark:border-l-brand-400",
    icon: "text-brand-600 dark:text-brand-300",
    glow: "shadow-brand-600/15 dark:shadow-brand-500/10"
  },
  green: {
    border: "border-l-rose-500 dark:border-l-rose-300",
    icon: "text-rose-600 dark:text-rose-200",
    glow: "shadow-brand-600/12 dark:shadow-brand-500/10"
  },
  amber: {
    border: "border-l-orange-500 dark:border-l-orange-300",
    icon: "text-orange-600 dark:text-orange-200",
    glow: "shadow-brand-600/12 dark:shadow-brand-500/10"
  }
};

export function StatCard({ icon: Icon, label, value, tone = "brand" }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`panel group relative overflow-hidden rounded-[22px] border border-l-[5px] border-brand-100/80 p-6 shadow-xl ${styles.border} ${styles.glow} transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-red-950/35 dark:bg-gradient-to-br dark:from-[#181113] dark:to-[#0e0e10]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-6 text-3xl font-bold leading-none text-slate-950 dark:text-white">{value ?? 0}</p>
        </div>
        <div className={`rounded-full bg-transparent p-1.5 transition group-hover:scale-105 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

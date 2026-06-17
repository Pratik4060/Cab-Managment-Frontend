import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { useAppSelector } from "../redux/hooks";

function GlobalRequestOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-black/60">
      <div className="rounded-2xl border border-brand-100 bg-white px-6 py-5 text-center shadow-2xl shadow-brand-600/15 dark:border-red-950/45 dark:bg-[#111114]">
        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-200 dark:border-t-transparent" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { active, message } = useAppSelector((state) => {
    const s = state as any;
    const slices: Array<{ loading: boolean; message?: string }> = [
      { loading: s.auth?.loading, message: s.auth?.requestMessage },
      { loading: s.dashboard?.loading, message: s.dashboard?.requestMessage },
      { loading: s.bookings?.loading, message: s.bookings?.requestMessage },
      { loading: s.trips?.loading, message: s.trips?.requestMessage },
      { loading: s.vehicles?.loading, message: s.vehicles?.requestMessage },
      { loading: s.drivers?.loading, message: s.drivers?.requestMessage },
      { loading: s.invoices?.loading, message: s.invoices?.requestMessage },
      { loading: s.payments?.loading, message: s.payments?.requestMessage },
      { loading: s.admins?.loading, message: s.admins?.requestMessage },
      { loading: s.reports?.loading, message: s.reports?.requestMessage },
      { loading: s.analytics?.loading, message: s.analytics?.requestMessage }
    ];

    const activeSlice = slices.find((slice) => slice.loading);
    return {
      active: Boolean(activeSlice),
      message: activeSlice?.message || "Processing request..."
    };
  });

  return (
    <div className="h-screen overflow-hidden bg-brand-50 text-slate-900 dark:bg-[#08080a] dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="relative flex-1 overflow-y-auto p-2.5 sm:p-3.5 lg:p-4">
            {children || <Outlet />}
          </main>
          {active && <GlobalRequestOverlay message={message} />}
        </div>
      </div>
    </div>
  );
}


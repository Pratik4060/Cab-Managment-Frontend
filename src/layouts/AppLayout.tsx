import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const routePath = location.pathname;
  const { active, message } = useAppSelector((state) => {
    const s = state as any;
    const slices: Array<{ key: string; loading: boolean; message?: string; defaultMessage?: string }> = [
      { key: "auth", loading: s.auth?.loading, message: s.auth?.requestMessage, defaultMessage: "Authenticating..." },
      { key: "dashboard", loading: s.dashboard?.loading, message: s.dashboard?.requestMessage, defaultMessage: "Loading dashboard..." },
      { key: "bookings", loading: s.bookings?.loading, message: s.bookings?.requestMessage, defaultMessage: "Processing bookings..." },
      { key: "trips", loading: s.trips?.loading, message: s.trips?.requestMessage, defaultMessage: "Processing trips..." },
      { key: "vehicles", loading: s.vehicles?.loading, message: s.vehicles?.requestMessage, defaultMessage: "Loading vehicles..." },
      { key: "drivers", loading: s.drivers?.loading, message: s.drivers?.requestMessage, defaultMessage: "Loading drivers..." },
      { key: "invoices", loading: s.invoices?.loading, message: s.invoices?.requestMessage, defaultMessage: "Processing invoices..." },
      { key: "payments", loading: s.payments?.loading, message: s.payments?.requestMessage, defaultMessage: "Processing payments..." },
      { key: "admins", loading: s.admins?.loading, message: s.admins?.requestMessage, defaultMessage: "Applying admin changes..." },
      { key: "reports", loading: s.reports?.loading, message: s.reports?.requestMessage, defaultMessage: "Loading reports..." },
      { key: "analytics", loading: s.analytics?.loading, message: s.analytics?.requestMessage, defaultMessage: "Loading analytics..." }
    ];

    const routePriority = routePath.includes("/invoices")
      ? "invoices"
      : routePath.includes("/bookings")
      ? "bookings"
      : routePath.includes("/trips")
      ? "trips"
      : routePath.includes("/drivers")
      ? "drivers"
      : routePath.includes("/vehicles")
      ? "vehicles"
      : "";

    const activeSlice = routePriority
      ? slices.find((slice) => slice.key === routePriority && slice.loading) || slices.find((slice) => slice.loading)
      : slices.find((slice) => slice.loading);

    return {
      active: Boolean(activeSlice),
      message: activeSlice?.message || activeSlice?.defaultMessage || "Processing request..."
    };
  });

  return (
    <div className="h-screen overflow-hidden bg-brand-50 text-slate-900 dark:bg-[#08080a] dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="scrollbar-slim relative flex-1 overflow-y-auto p-2.5 sm:p-3.5 lg:p-4">
            {children || <Outlet />}
          </main>
          {active && <GlobalRequestOverlay message={message} />}
        </div>
      </div>
    </div>
  );
}


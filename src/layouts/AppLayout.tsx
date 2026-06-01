import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";

export function AppLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-screen overflow-hidden bg-brand-50 text-slate-900 dark:bg-[#08080a] dark:text-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 lg:p-4">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}


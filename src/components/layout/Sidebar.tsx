import { BarChart3, Car, ChevronRight, FileText, Monitor, LogOut, Shield, UserCircle, Users, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo2.png";
import { useAppDispatch } from "../../redux/hooks";
import { logout } from "../../redux/slices/authSlice";

const sections = [
  {
    label: "Main",
    items: [{ label: "Dashboard", path: "/", icon: Monitor  }]
  },
  {
    label: "Inventory",
    items: [
      { label: "Cars", path: "/inventory/cars", icon: Car },
      { label: "Drivers", path: "/inventory/drivers", icon: Users }
    ]
  },
  {
    label: "Bookings",
    items: [
      { label: "Trips", path: "/bookings/trips", icon: Route }
    ]
  },
  {
    label: "Billing",
    items: [{ label: "Invoices", path: "/invoices", icon: FileText }]
  },
  {
    label: "Reports",
    items: [{ label: "Reports", path: "/reports", icon: BarChart3 }]
  },
  {
    label: "Admin",
    items: [
      { label: "Profile", path: "/admin/profile", icon: UserCircle },
      { label: "Manage Admins", path: "/admin/manage", icon: Shield }
    ]
  }
];

export function Sidebar({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    function syncActivePath(event: Event) {
      setActivePath((event as CustomEvent<string>).detail || window.location.pathname);
    }

    window.addEventListener("cab-route-change", syncActivePath);
    window.addEventListener("popstate", syncActivePath);
    return () => {
      window.removeEventListener("cab-route-change", syncActivePath);
      window.removeEventListener("popstate", syncActivePath);
    };
  }, []);

  function goTo(path: string) {
    setActivePath(path);
    navigate(path);
    window.dispatchEvent(new CustomEvent("cab-route-change", { detail: path }));
    onClose?.();
  }

  function isActivePath(path: string) {
    if (path === "/") return activePath === "/" || activePath === "/dashboard";
    return activePath === path || activePath.startsWith(`${path}/`);
  }

  return (
    <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-62 flex-col border-r border-brand-100 bg-white/95 shadow-xl backdrop-blur transition md:static md:translate-x-0 dark:border-red-950/45 dark:bg-[#09090b]/98 dark:shadow-black/50`}>
      <div className="flex h-16 items-center border-b border-brand-100 px-2 dark:border-red-950/45 dark:bg-gradient-to-r dark:from-[#0b0b0d] dark:via-[#100708] dark:to-[#16090a]">
        <img
          src={logo}
          alt="Unique Carz"
          className="-ml-` h-12 w-12 shrink-0 object-contain"
        />

        <div className="min-w-0">
          <div className="ml-2 text-lg font-semibold text-brand-600 dark:text-brand-200">
            Unique Carz
          </div>
          {/* <div className="text-xs font-semibold text-brand-600 dark:text-brand-200">
            Corporate Cabs
          </div> */}
        </div>
      </div>
      <nav className="scrollbar-hidden flex-1 space-y-5 overflow-y-auto p-3 dark:bg-gradient-to-b dark:from-[#09090b] dark:via-[#0b0b0d] dark:to-[#0b0506]">
        {sections.map((section) => (
          <div key={section.label}>
            {section.label !== "Main" && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-brand-700/70 dark:text-red-200/55">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map(({ label, path, icon: Icon }) => {
                const isActive = isActivePath(path);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => goTo(path)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${isActive ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-md shadow-brand-600/25 dark:from-brand-700 dark:via-brand-600 dark:to-brand-500 dark:text-white dark:shadow-[0_10px_28px_rgba(237,28,36,0.22)]" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-[#1a0e10] dark:hover:text-white dark:hover:shadow-[inset_3px_0_0_rgba(237,28,36,0.65)]"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-current opacity-0 transition group-hover:opacity-80" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="sticky bottom-0 border-t border-brand-100 bg-white p-4 dark:border-red-950/40 dark:bg-[#09090b]">
        {/* <div className="mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || "Admin"}</p>
          <p className="truncate text-xs text-slate-500">{user?.role || "Administrator"}</p>
        </div> */}
        <button className="btn-secondary w-full justify-start" onClick={() => dispatch(logout())}>
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}


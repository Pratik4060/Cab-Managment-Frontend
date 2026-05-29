import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AdminsPage, ProfilePage } from "../pages/AdminPage";
import { InquiriesPage } from "../pages/BookingsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CarsPage, DriversPage } from "../pages/InventoryPages";
import { InvoicesPage } from "../pages/InvoicesPage";
import { LoginPage } from "../pages/LoginPage";
import { ReportsPage } from "../pages/ReportsPage";
import { TripsPage } from "../pages/TripsPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    function syncRoute(event: Event) {
      setActivePath((event as CustomEvent<string>).detail || window.location.pathname);
    }

    window.addEventListener("cab-route-change", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("cab-route-change", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  if (activePath === "/login") {
    return <LoginPage />;
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <PageForPath pathname={activePath} />
      </AppLayout>
    </ProtectedRoute>
  );
}

function PageForPath({ pathname }: { pathname: string }) {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/dashboard") return <DashboardPage />;
  if (["/cab", "/cars", "/inventory/cars"].includes(path)) return <CarsPage />;
  if (["/drivers", "/inventory/drivers"].includes(path)) return <DriversPage />;
  if (["/booking", "/bookings", "/bookings/inquiries"].includes(path)) return <InquiriesPage />;
  if (["/trips", "/bookings/trips"].includes(path)) return <TripsPage />;
  if (["/invoice", "/invoices"].includes(path)) return <InvoicesPage />;
  if (path === "/report" || path === "/reports" || path.startsWith("/reports/")) return <ReportsPage />;
  if (["/profile", "/admin/profile"].includes(path)) return <ProfilePage />;
  if (["/admins", "/manage-admins", "/admin/manage"].includes(path)) return <AdminsPage />;

  return <Navigate to="/" replace />;
}

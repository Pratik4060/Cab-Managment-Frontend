import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { loadMe } from "../redux/slices/authSlice";

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  useEffect(() => { if (isAuthenticated && !user) dispatch(loadMe()); }, [dispatch, isAuthenticated, user]);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children ? <>{children}</> : <Outlet />;
}


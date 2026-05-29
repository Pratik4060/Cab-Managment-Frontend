import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, CarFront, Eye, EyeOff, FileCheck2, Route } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export function LoginPage() {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "superadmin@caberp.local", password: "Admin@12345" }
  });
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr] dark:border-slate-800 dark:bg-slate-900">
        <section className="flex flex-col justify-between bg-slate-950 p-8 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600">
                <CarFront className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Cab ERP</h1>
                <p className="text-sm text-slate-300">Management & Billing Automation</p>
              </div>
            </div>
            <div className="mt-16 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">Corporate Operations Console</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight">Control bookings, trips, invoices, and payments from one workspace.</h2>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Built for dispatch teams, billing admins, and managers who need fast assignment, clean records, and dependable reporting.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Live Trips", icon: Route },
              { label: "Billing", icon: FileCheck2 },
              { label: "Analytics", icon: BarChart3 }
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <Icon className="mb-3 h-5 w-5 text-brand-200" />
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Sign in to your account</h2>
              <p className="mt-2 text-sm text-slate-500">Use your admin credentials to access cab operations.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit((values) => dispatch(login(values)))}>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Email</span>
                <input className="input h-11" {...register("email")} />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-medium">Password</span>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="input h-11 pr-10" {...register("password")} />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
              </label>
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40">{error}</div>}
              <button className="btn-primary h-11 w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}


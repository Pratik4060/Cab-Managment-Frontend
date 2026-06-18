import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, Eye, EyeOff, FileCheck2, Loader2, Route } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import logo from "../assets/logo.png";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";
import { showToast } from "../utils/toast";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export function LoginPage() {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@uniquecar.com", password: "" }
  });
  const submitLogin = handleSubmit(async (values) => {
    try {
      await dispatch(login({ ...values, password: values.password.trim() })).unwrap();
      showToast({ type: "success", title: "Login successful", message: "Welcome back to Unique Carz." });
    } catch {
      // Axios/auth state already surfaces the readable error.
    }
  });

  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-brand-50 p-3 text-slate-900 dark:bg-[#08080a] dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-xl border border-brand-100 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr] dark:border-red-950/40 dark:bg-[#101012]">
        <section className="flex flex-col justify-between bg-gradient-to-br from-[#070708] via-[#15090a] to-[#08080a] p-6 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-brand-500/30 bg-white shadow-lg shadow-brand-600/30">
                <img src={logo} alt="Unique Carz" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Unique Carz</h1>
                <p className="text-sm text-slate-300">Corporate Cabs and Transportation Services</p>
              </div>
            </div>
            <div className="mt-12 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-200">Corporate Operations Console</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">Control bookings, trips, invoices, and payments from one workspace.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
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
                <Icon className="mb-3 h-5 w-5 text-red-200" />
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-200">Welcome back</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Sign in to your account</h2>
              <p className="mt-2 text-sm text-slate-500">Use your admin credentials to access Unique Carz operations.</p>
            </div>
            <form className="space-y-4" onSubmit={submitLogin}>
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
              <button className="btn-primary h-11 w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </section>
      </div>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 p-4 backdrop-blur-md dark:bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-2xl shadow-brand-600/20 dark:border-red-950/45 dark:bg-[#111114] dark:shadow-black/50">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-200">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">Signing you in</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Connecting to Unique Carz secure admin API...</p>
          </div>
        </div>
      )}
    </div>
  );
}


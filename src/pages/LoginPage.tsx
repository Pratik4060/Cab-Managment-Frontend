import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  Route,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import logo from "../assets/logo.png";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";
import { showToast } from "../utils/toast";

const schema = z.object({
  email: z.string().min(1, "Email is required.").email("Invalid Email"),

  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export function LoginPage() {
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@uniquecar.com", password: "" },
  });

  const submitLogin = handleSubmit(async (values) => {
    try {
      await dispatch(
        login({ ...values, password: values.password.trim() }),
      ).unwrap();
      showToast({
        type: "success",
        title: "Login successful",
        message: "Welcome back to Unique Carz.",
      });
    } catch {
      // Axios/auth state already surfaces the readable error.
    }
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-brand-50 p-3 text-slate-900 dark:bg-[#08080a] dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-xl border border-brand-100 bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr] dark:border-red-950/40 dark:bg-[#101012]">
        {/* Left Section - Branding */}
        <section className="flex flex-col justify-between bg-gradient-to-br from-[#070708] via-[#15090a] to-[#08080a] p-4 sm:p-6 text-white">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-lg border border-brand-500/30 bg-white shadow-lg shadow-brand-600/30">
                <img
                  src={logo}
                  alt="Unique Carz"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Unique Carz</h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Corporate Cabs and Transportation Services
                </p>
              </div>
            </div>
            <div className="mt-8 sm:mt-12 max-w-lg">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-red-200">
                Corporate Operations Console
              </p>
              <h2 className="hidden sm:block mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                Control bookings, trips, invoices, and payments from one
                workspace.
              </h2>
              <p className="hidden sm:block mt-3 sm:mt-4 text-xs sm:text-sm leading-6 text-slate-300">
                Built for dispatch teams, billing admins, and managers who need
                fast assignment, clean records, and dependable reporting.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3 mt-6 sm:mt-0">
            {[
              { label: "Live Trips", icon: Route },
              { label: "Billing", icon: FileCheck2 },
              { label: "Analytics", icon: BarChart3 },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4"
              >
                <Icon className="mb-2 sm:mb-3 h-4 w-4 sm:h-5 sm:w-5 text-red-200" />
                <p className="text-xs sm:text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Section - Login Form */}
        <section className="flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-md px-2 sm:px-0">
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-200">
                Welcome back
              </p>
              <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                Sign in to your account
              </h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                Use your admin credentials to access Unique Carz operations.
              </p>
            </div>
            <form className="space-y-4 sm:space-y-5" onSubmit={submitLogin}>
              <label className="block">
                <span className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium">
                  Email
                </span>
                <input
                  className="input h-10 sm:h-11 text-sm sm:text-base w-full"
                  {...register("email")}
                />
                {errors.email && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input h-10 sm:h-11 pr-8 sm:pr-10 text-sm sm:text-base w-full"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-1 sm:right-2 top-1/2 flex h-7 w-7 sm:h-8 sm:w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="mt-1 block text-xs text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </label>

              {/* Fixed Error Message Container */}
              {error && (
                <div className="rounded-md bg-red-50 p-3 sm:p-3.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 w-full">
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="flex-1">{error}</span>
                  </div>
                </div>
              )}

              <button
                className="btn-primary h-10 sm:h-11 w-full text-sm sm:text-base flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                )}
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Fixed Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 p-4 backdrop-blur-sm dark:bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-4 sm:p-6 text-center shadow-2xl shadow-brand-600/20 dark:border-red-950/45 dark:bg-[#111114] dark:shadow-black/50">
            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-200">
              <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
            </div>
            <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              Signing you in
            </h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Connecting to Unique Carz secure admin API...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

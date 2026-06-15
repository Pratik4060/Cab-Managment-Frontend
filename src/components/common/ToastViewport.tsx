import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { ToastPayload, ToastType } from "../../utils/toast";

type ToastItem = ToastPayload & {
  id: string;
  type: ToastType;
};

const styles: Record<ToastType, { icon: typeof Info; className: string; iconClassName: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-white text-slate-950 shadow-emerald-900/10 dark:border-emerald-900/50 dark:bg-[#111114] dark:text-white",
    iconClassName: "text-emerald-600 dark:text-emerald-300"
  },
  error: {
    icon: XCircle,
    className: "border-red-200 bg-white text-slate-950 shadow-red-900/10 dark:border-red-900/60 dark:bg-[#111114] dark:text-white",
    iconClassName: "text-brand-600 dark:text-brand-300"
  },
  info: {
    icon: Info,
    className: "border-slate-200 bg-white text-slate-950 shadow-slate-900/10 dark:border-slate-800 dark:bg-[#111114] dark:text-white",
    iconClassName: "text-slate-600 dark:text-slate-300"
  }
};

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;

      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = {
        id,
        type: detail.type || "info",
        title: detail.title,
        message: detail.message,
        duration: detail.duration ?? 3500
      };

      setToasts((current) => [item, ...current].slice(0, 4));
      window.setTimeout(() => removeToast(id), item.duration);
    }

    window.addEventListener("cab-toast", handleToast);
    return () => window.removeEventListener("cab-toast", handleToast);
  }, []);

  function removeToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-16 z-[10000] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2">
      {toasts.map((toast) => {
        const tone = styles[toast.type];
        const Icon = tone.icon;

        return (
          <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur ${tone.className}`}>
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconClassName}`} />
            <div className="min-w-0 flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              <p className="text-sm text-slate-600 dark:text-slate-300">{toast.message}</p>
            </div>
            <button type="button" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-white" onClick={() => removeToast(toast.id)} aria-label="Close notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

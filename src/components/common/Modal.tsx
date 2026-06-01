import { X } from "lucide-react";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed left-0 top-0 z-[9999] flex h-dvh w-screen justify-end overflow-hidden bg-black/35 backdrop-blur-sm dark:bg-black/70"
      onMouseDown={onClose}
    >
      <div
        className="flex h-full w-full max-w-[700px] translate-x-0 flex-col border-l border-brand-100 bg-white shadow-2xl shadow-black/25 transition-transform duration-300 dark:border-red-950/45 dark:bg-[#101012] dark:shadow-black/60"
        onMouseDown={(event: MouseEvent<HTMLDivElement>) =>
          event.stopPropagation()
        }
      >
        <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-red-950/35 dark:bg-[#101012]">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>
          <button
            className="btn-secondary p-1.5"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="scrollbar-hidden flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

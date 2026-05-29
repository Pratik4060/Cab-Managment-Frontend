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
    <div className="fixed left-0 top-0 z-[9999] flex h-dvh w-screen items-center justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm dark:bg-black/75" onMouseDown={onClose}>
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl" onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-red-950/35">
          <h2 className="font-semibold text-slate-950 dark:text-white">{title}</h2>
          <button className="btn-secondary p-2" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}


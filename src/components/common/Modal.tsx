import { X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm dark:bg-black/55" onMouseDown={onClose}>
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl" onMouseDown={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-red-950/35">
          <h2 className="font-semibold text-slate-950 dark:text-white">{title}</h2>
          <button className="btn-secondary p-2" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}


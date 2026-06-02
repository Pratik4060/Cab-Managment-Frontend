import { AlertTriangle } from "lucide-react";
import { type ReactNode } from "react";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirm Delete",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Are you sure want to delete?</p>
            <div className="text-sm text-red-700 dark:text-red-100/90">{message}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

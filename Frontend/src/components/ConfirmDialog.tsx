import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="font-display font-bold text-navy-900 text-lg">{title}</h3>
            <p className="text-navy-400 text-sm mt-1">{message}</p>
          </div>
          <div className="flex gap-3 w-full pt-1">
            <button onClick={onCancel} className="btn-outline flex-1">Cancel</button>
            <button onClick={onConfirm} className="btn-danger flex-1">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useApp } from "../context";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in-right bg-white border ${
            t.type === "success"
              ? "border-primary-200"
              : t.type === "error"
              ? "border-red-200"
              : "border-navy-200"
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />}
          {t.type === "error" && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
          {t.type === "info" && <Info className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" />}
          <p className="text-sm text-navy-800 flex-1">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-navy-300 hover:text-navy-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

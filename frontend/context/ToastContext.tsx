"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { X, CheckCircle2, AlertCircle, Info, Loader2, Mic, Bot, Phone } from "lucide-react";

type ToastType = "success" | "error" | "info" | "loading" | "call";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    loading: (message: string, duration?: number) => void;
    call: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-[#2ea043] flex-shrink-0" />,
  error: <AlertCircle size={16} className="text-[#f85149] flex-shrink-0" />,
  info: <Info size={16} className="text-[#58a6ff] flex-shrink-0" />,
  loading: <Loader2 size={16} className="text-[#58a6ff] animate-spin flex-shrink-0" />,
  call: <Phone size={16} className="text-[#a371f7] flex-shrink-0" />,
};

const BG_MAP: Record<ToastType, string> = {
  success: "border-[#2ea043]/30 bg-[#2ea043]/10",
  error: "border-[#f85149]/30 bg-[#f85149]/10",
  info: "border-[#58a6ff]/30 bg-[#58a6ff]/10",
  loading: "border-[#58a6ff]/30 bg-[#58a6ff]/10",
  call: "border-[#a371f7]/30 bg-[#a371f7]/10",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-toastIn ${BG_MAP[toast.type]} bg-[#161b22]/90`}
      style={{ minWidth: 260, maxWidth: 400 }}
    >
      {ICON_MAP[toast.type]}
      <span className="text-[13px] text-[#c9d1d9] font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="cursor-pointer text-[#8b949e] hover:text-white transition-colors flex-shrink-0 p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration: number = 3500) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]); // Max 5 toasts

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const toast = {
    success: (msg: string, dur?: number) => addToast("success", msg, dur),
    error: (msg: string, dur?: number) => addToast("error", msg, dur ?? 5000),
    info: (msg: string, dur?: number) => addToast("info", msg, dur),
    loading: (msg: string, dur?: number) => addToast("loading", msg, dur ?? 4000),
    call: (msg: string, dur?: number) => addToast("call", msg, dur ?? 3000),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

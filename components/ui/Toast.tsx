"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const icons: Record<ToastType, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styles: Record<ToastType, string> = {
  success: "border-success-500 bg-success-50 text-success-600",
  error: "border-error-500 bg-error-50 text-error-600",
  warning: "border-warning-500 bg-warning-50 text-warning-700",
  info: "border-brand-500 bg-brand-50 text-brand-500",
};

const ToastContext = createContext<{
  toast: (type: ToastType, message: string) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-theme-lg ${styles[t.type]}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="text-theme-sm font-medium">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="ml-auto shrink-0">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

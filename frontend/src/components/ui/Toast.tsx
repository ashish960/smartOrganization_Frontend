"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const styleVariants = {
    success: {
      wrapper: "bg-success/10 border-success/20 text-success",
      icon: "✅",
      progress: "bg-success",
    },
    error: {
      wrapper: "bg-error/10 border-error/20 text-error",
      icon: "❌",
      progress: "bg-error",
    },
    warning: {
      wrapper: "bg-warning/10 border-warning/20 text-warning",
      icon: "⚠️",
      progress: "bg-warning",
    },
    info: {
      wrapper: "bg-primary/10 border-primary/20 text-primary",
      icon: "ℹ️",
      progress: "bg-primary",
    },
  };

  const variant = styleVariants[toast.type];

  return (
    <div
      onClick={handleRemove}
      className={`relative flex items-center gap-3 min-w-[300px] max-w-[400px] p-3 mb-2 rounded-xl border backdrop-blur-md shadow-lg cursor-pointer transition-all duration-300 ease-out overflow-hidden ${variant.wrapper} ${
        isLeaving ? "translate-x-[120%] opacity-0" : isVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      }`}
    >
      <span className="text-lg flex-shrink-0">{variant.icon}</span>
      <p className="text-sm font-medium flex-1 leading-snug text-text-primary">
        {toast.message}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 rounded-bl-xl opacity-70 ${variant.progress}`}
        style={{
          width: "100%",
          animation: `shrink ${toast.duration || 4000}ms linear forwards`,
        }}
      />
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
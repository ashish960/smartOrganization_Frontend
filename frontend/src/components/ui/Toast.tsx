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

// Single Toast Item
const ToastItem = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto remove
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const styles = {
    success: {
      background: "rgba(34, 197, 94, 0.15)",
      border: "1px solid rgba(34, 197, 94, 0.3)",
      icon: "✅",
      color: "#22c55e",
      progressColor: "#22c55e",
    },
    error: {
      background: "rgba(239, 68, 68, 0.15)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
      icon: "❌",
      color: "#ef4444",
      progressColor: "#ef4444",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.15)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      icon: "⚠️",
      color: "#f59e0b",
      progressColor: "#f59e0b",
    },
    info: {
      background: "rgba(59, 130, 246, 0.15)",
      border: "1px solid rgba(59, 130, 246, 0.3)",
      icon: "ℹ️",
      color: "#3b82f6",
      progressColor: "#3b82f6",
    },
  };

  const style = styles[toast.type];

  return (
    <div
      style={{
        background: style.background,
        border: style.border,
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
        maxWidth: "400px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transform: isLeaving
          ? "translateX(120%)"
          : isVisible
          ? "translateX(0)"
          : "translateX(120%)",
        opacity: isLeaving ? 0 : isVisible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={handleRemove}
    >
      {/* Icon */}
      <span style={{ fontSize: "18px", flexShrink: 0 }}>
        {style.icon}
      </span>

      {/* Message */}
      <p
        style={{
          color: "white",
          fontSize: "14px",
          fontWeight: 500,
          flex: 1,
          lineHeight: "1.4",
        }}
      >
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: "16px",
          flexShrink: 0,
          padding: "0",
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: style.progressColor,
          borderRadius: "0 0 0 12px",
          animation: `shrink ${toast.duration || 4000}ms linear forwards`,
          opacity: 0.7,
        }}
      />
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};
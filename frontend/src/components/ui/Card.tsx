"use client";

import { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

// Reusable card wrapper — consistent surface styling across all pages
export default function Card({ children, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        padding: "20px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--color-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
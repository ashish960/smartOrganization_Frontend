"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-sm transition-all duration-300 ${onClick ? "cursor-pointer hover:bg-surface-hover hover:border-primary/30 hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
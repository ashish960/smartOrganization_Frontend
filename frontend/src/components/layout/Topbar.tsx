"use client";

import { Icons } from "@/constants/icons";
import Avatar from "@/components/ui/Avatar";

interface TopbarProps {
  title: string;
  subtitle?: string;
  userName: string;
}

export default function Topbar({ title, subtitle, userName }: TopbarProps) {
  return (
    <header style={{
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0 24px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>
      {/* Left: page title */}
      <div>
        <h1 style={{ fontSize: "18px", fontWeight: "700" }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{subtitle}</p>
        )}
      </div>

      {/* Right: bell + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "8px",
          cursor: "pointer",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}>
          <Icons.Bell />
          {/* notification dot */}
          <span style={{
            position: "absolute", top: "6px", right: "6px",
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#3b82f6",
          }}/>
        </button>

        <Avatar name={userName} size={34} />
      </div>
    </header>
  );
}
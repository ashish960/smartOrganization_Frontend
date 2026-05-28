"use client";

import { Icons } from "@/constants/icons";
import { STAT_CARDS } from "@/constants/navigation";

// Renders the 4 stat cards — later you'll pass real data via props from useDashboard hook
export default function StatsGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "28px",
    }}>
      {STAT_CARDS.map((stat) => {
        const IconComp = Icons[stat.icon];
        return (
          <div
            key={stat.label}
            style={{
              padding: "20px",
              borderRadius: "14px",
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              transition: "transform 0.2s ease",
            }}
          >
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", marginBottom: "12px",
            }}>
              <div style={{
                padding: "8px", borderRadius: "8px",
                background: `${stat.color}18`, color: stat.color,
              }}>
                <IconComp />
              </div>
            </div>
            <p style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {stat.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
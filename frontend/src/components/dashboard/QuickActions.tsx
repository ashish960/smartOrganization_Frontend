"use client";

import { useRouter } from "next/navigation";
import { Icons } from "@/constants/icons";
import { QUICK_ACTIONS } from "@/constants/navigation";
import Card from "@/components/ui/Card";

export default function QuickActions() {
  const router = useRouter();

  return (
    <Card>
      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
        Quick Actions
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {QUICK_ACTIONS.map((action) => {
          const IconComp = Icons[action.icon];
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: `1px solid ${action.color}22`,
                background: `${action.color}08`,
                cursor: "pointer",
                color: "var(--color-text)",
                fontSize: "14px",
                fontWeight: "500",
                textAlign: "left",
                transition: "all 0.15s ease",
                width: "100%",
              }}
            >
              <span style={{
                color: action.color, padding: "6px", borderRadius: "7px",
                background: `${action.color}15`, display: "flex", alignItems: "center",
              }}>
                <IconComp />
              </span>
              {action.label}
              <span style={{ marginLeft: "auto", opacity: 0.4 }}>
                <Icons.ChevronRight />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
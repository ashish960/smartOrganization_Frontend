"use client";

import { Icons } from "@/constants/icons";
import Card from "@/components/ui/Card";

// Later: accept activityItems[] as props from useDashboard hook
export default function RecentActivity() {
  const isEmpty = true; // replace with real data check later

  return (
    <Card>
      <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
        Recent Activity
      </h3>

      {isEmpty ? (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 20px", gap: "12px", opacity: 0.5,
        }}>
          <Icons.Info />
          <p style={{ fontSize: "14px", fontWeight: "600" }}>No activity yet</p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
            Upload a document or start an AI chat to see activity here
          </p>
        </div>
      ) : (
        // Future: map over activityItems and render them here
        null
      )}
    </Card>
  );
}
"use client";

// Shows current plan + trial status — hidden once user upgrades
export default function TrialBanner() {
  return (
    <div style={{
      marginBottom: "24px",
      padding: "14px 20px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(168,85,247,0.1))",
      border: "1px solid rgba(59,130,246,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px" }}>🎉</span>
        <div>
          <p style={{ fontSize: "14px", fontWeight: "600" }}>Welcome to SmartOrg AI!</p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            You&apos;re on the <strong>Starter plan</strong> — 14-day free trial active
          </p>
        </div>
      </div>
      <button className="gradient-button" style={{ padding: "8px 16px", fontSize: "13px" }}>
        Upgrade Plan
      </button>
    </div>
  );
}
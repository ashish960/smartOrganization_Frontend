"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature") ?? "This feature";

  return (
    <DashboardLayout title={feature}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "400px", flexDirection: "column", gap: "12px", opacity: 0.5,
      }}>
        <p style={{ fontSize: "32px" }}>🚧</p>
        <p style={{ fontSize: "16px", fontWeight: "600" }}>Coming Soon</p>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {feature} is under development
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={
      <DashboardLayout title="Feature">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
          <p style={{ fontSize: "14px", opacity: 0.5 }}>Loading feature details...</p>
        </div>
      </DashboardLayout>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}
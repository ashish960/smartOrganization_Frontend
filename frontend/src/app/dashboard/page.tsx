"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import TrialBanner from "@/components/dashboard/TrialBanner";
import StatsGrid from "@/components/dashboard/StatsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";

// ── This is all page.tsx should ever be ──
// Layout, auth, sidebar, topbar — all handled by DashboardLayout
// Just compose your section components here

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <TrialBanner />
      <StatsGrid />
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}>
        <QuickActions />
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}
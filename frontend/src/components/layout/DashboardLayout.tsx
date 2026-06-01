"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!isAuthenticated && !token) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/auth/login");
  };

  const userName = user?.name ?? "User";
  const orgName = (user as { organization?: { name?: string } } | null)?.organization?.name ?? "Your Organization";
  const firstName = userName.split(" ")[0];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--color-bg)",
      color: "var(--color-text)",
    }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        userName={userName}
        orgName={orgName}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar
          title={title}
          subtitle={subtitle ?? `Welcome back, ${firstName} 👋`}
          userName={userName}
        />
        <main style={{
          flex: 1,
          padding: "28px 24px",
          overflowY: "auto",
        }}>
          {children}
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
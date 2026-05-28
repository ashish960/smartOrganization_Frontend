"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Icons } from "@/constants/icons";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// THE main layout wrapper — every dashboard page uses this
// Usage:
//   <DashboardLayout title="Documents" subtitle="Manage your files">
//     <YourPageContent />
//   </DashboardLayout>

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
  setMounted(true);
  const token = localStorage.getItem("token");
  if (!isAuthenticated && !token) {
    router.push("/auth/login");
  }
}, [isAuthenticated, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/auth/login");
  };

  // Show spinner while checking auth
  if (!isAuthenticated || !mounted) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
      }}>
        <Icons.Spinner />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const userName = user?.name ?? "User";
  const orgName = (user as any)?.organization?.name ?? "Your Organization";
  const firstName = userName.split(" ")[0];

  console.log("isAuthenticated:", isAuthenticated);
console.log("mounted:", mounted);
console.log("token in storage:", localStorage.getItem("token"));
console.log("user in storage:", localStorage.getItem("user"));

  return (
    
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--color-bg)",
      color: "var(--color-text)",
    }}>
      {/* Sidebar — written once, shared by all pages */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        userName={userName}
        orgName={orgName}
        onLogout={handleLogout}
      />

      {/* Right side: topbar + page content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar
          title={title}
          subtitle={subtitle ?? `Welcome back, ${firstName} 👋`}
          userName={userName}
        />

        {/* Page-specific content injected here */}
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
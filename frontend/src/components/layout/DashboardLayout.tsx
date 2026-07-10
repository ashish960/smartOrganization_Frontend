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
  noScroll?: boolean;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  noScroll = false,
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
    <div className="flex h-screen bg-background text-text-primary overflow-hidden selection:bg-primary/30">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        userName={userName}
        orgName={orgName}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle ?? `Welcome back, ${firstName} 👋`}
          userName={userName}
        />
        <main className={`flex-1 p-6 md:p-8 ${noScroll ? "overflow-hidden" : "overflow-y-auto"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
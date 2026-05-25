"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/auth/login");
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      {/* Header */}
      <header
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="gradient-text text-2xl font-bold">SmartOrg AI</h1>
          <div className="flex items-center gap-4">
            <span style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--color-error)",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Welcome to SmartOrg AI! 🎉
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Dashboard features coming soon...
          </p>
        </div>
      </main>
    </div>
  );
}
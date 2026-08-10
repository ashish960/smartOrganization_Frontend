"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppRootState } from "@/store";
import { Icons } from "@/constants/icons";

interface DocumentFile {
  size: number;
}

interface ChatSession {
  messages: Array<{ role: string }>;
}

const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  primary:   { text: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20"   },
  secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  success:   { text: "text-success",   bg: "bg-success/10",   border: "border-success/20"   },
  warning:   { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20"   },
  error:     { text: "text-error",     bg: "bg-error/10",     border: "border-error/20"     },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function StatsGrid() {
  const { token } = useSelector((state: AppRootState) => state.auth);
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalQueries: 0,
    totalMembers: 1,
    storageUsedMB: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [docRes, chatRes, membRes] = await Promise.all([
          fetch(`${API_BASE}/documents`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch(`${API_BASE}/chat/sessions`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch(`${API_BASE}/organization/members`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);

        let docsCount = 0;
        let storageBytes = 0;
        let queriesCount = 0;
        let membersCount = 1;

        if (docRes.success && Array.isArray(docRes.data)) {
          docsCount = docRes.data.length;
          storageBytes = docRes.data.reduce((acc: number, doc: DocumentFile) => acc + (doc.size || 0), 0);
        }

        if (chatRes.success && Array.isArray(chatRes.data)) {
          chatRes.data.forEach((session: ChatSession) => {
            const userMessages = session.messages?.filter(m => m.role === "user") || [];
            queriesCount += userMessages.length;
          });
        }

        if (membRes.success && Array.isArray(membRes.data)) {
          membersCount = membRes.data.length;
        }

        const storageMB = storageBytes / (1024 * 1024);

        setStats({
          totalDocs: docsCount,
          totalQueries: queriesCount,
          totalMembers: membersCount,
          storageUsedMB: storageMB,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const cards = [
    {
      label: "Total Documents",
      value: stats.totalDocs.toString(),
      sub: stats.totalDocs === 0 ? "Upload your first doc" : `${stats.totalDocs} files uploaded`,
      color: "primary",
      icon: "Documents" as const,
      route: "/documents",
    },
    {
      label: "AI Queries",
      value: stats.totalQueries.toString(),
      sub: `${100 - stats.totalQueries} queries remaining`,
      color: "secondary",
      icon: "AI" as const,
      route: "/chat",
    },
    {
      label: "Team Members",
      value: stats.totalMembers.toString(),
      sub: stats.totalMembers === 1 ? "You're the admin" : `${stats.totalMembers} active members`,
      color: "success",
      icon: "Users" as const,
      route: "/team",
    },
    {
      label: "Storage Used",
      value: `${stats.storageUsedMB.toFixed(2)} MB`,
      sub: `${(1024 - stats.storageUsedMB).toFixed(1)} MB available`,
      color: "warning",
      icon: "Analytics" as const,
      route: "/documents",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
      {cards.map((stat) => {
        const IconComp = Icons[stat.icon];
        const colors = colorMap[stat.color] ?? colorMap.primary;
        return (
          <button
            key={stat.label}
            onClick={() => router.push(stat.route)}
            className={`p-5 rounded-2xl bg-surface/50 backdrop-blur-sm shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 border ${colors.border} text-left w-full focus:outline-none focus:ring-2 focus:ring-primary/20`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${colors.bg} ${colors.text}`}>
                <IconComp />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-surface-hover animate-pulse rounded mb-1" />
            ) : (
              <p className="text-3xl font-extrabold text-text-primary tracking-tight mb-1">
                {stat.value}
              </p>
            )}
            <p className="text-sm font-semibold text-text-primary mb-0.5">
              {stat.label}
            </p>
            <p className="text-xs font-medium text-text-muted">
              {stat.sub}
            </p>
          </button>
        );
      })}
    </div>
  );
}
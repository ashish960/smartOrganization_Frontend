"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { AppRootState } from "@/store";
import { Icons } from "@/constants/icons";
import Card from "@/components/ui/Card";

interface ActivityItem {
  id: string;
  type: "document" | "chat" | "member" | "department";
  title: string;
  subtitle: string;
  timestamp: Date;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function RecentActivity() {
  const { token } = useSelector((state: AppRootState) => state.auth);
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchActivity = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [docRes, chatRes, deptRes, membRes] = await Promise.all([
          fetch(`${API_BASE}/documents`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch(`${API_BASE}/chat/sessions`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch(`${API_BASE}/departments`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
          fetch(`${API_BASE}/organization/members`, { headers }).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ]);

        const merged: ActivityItem[] = [];

        if (docRes.success && Array.isArray(docRes.data)) {
          docRes.data.forEach((doc: { _id: string; originalName: string; fileType: string; createdAt: string }) => {
            merged.push({
              id: doc._id,
              type: "document",
              title: `Uploaded document`,
              subtitle: `${doc.originalName} (${doc.fileType.toUpperCase()})`,
              timestamp: new Date(doc.createdAt),
            });
          });
        }

        if (chatRes.success && Array.isArray(chatRes.data)) {
          chatRes.data.forEach((chat: { _id: string; title: string; updatedAt: string }) => {
            merged.push({
              id: chat._id,
              type: "chat",
              title: `AI Conversation`,
              subtitle: chat.title || "New Chat Session",
              timestamp: new Date(chat.updatedAt),
            });
          });
        }

        if (deptRes.success && Array.isArray(deptRes.data)) {
          deptRes.data.forEach((dept: { _id: string; name: string; icon: string; createdAt: string }) => {
            merged.push({
              id: dept._id,
              type: "department",
              title: `Created department`,
              subtitle: `${dept.icon} ${dept.name}`,
              timestamp: new Date(dept.createdAt),
            });
          });
        }

        if (membRes.success && Array.isArray(membRes.data)) {
          membRes.data.forEach((m: { _id: string; name: string; role: string; createdAt: string }) => {
            merged.push({
              id: m._id,
              type: "member",
              title: `New team member`,
              subtitle: `${m.name} (${m.role.replace("_", " ")})`,
              timestamp: new Date(m.createdAt),
            });
          });
        }

        const sorted = merged
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5);

        setActivities(sorted);
      } catch (err) {
        console.error("Failed to build activity log", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [token]);

  const handleActivityClick = (type: "document" | "chat" | "member" | "department") => {
    const routes = {
      document: "/documents",
      chat: "/chat",
      member: "/team",
      department: "/departments",
    };
    router.push(routes[type]);
  };

  return (
    <Card className="h-full flex flex-col min-h-[300px]">
      <h3 className="text-base font-bold text-text-primary tracking-tight mb-4">
        Recent Activity
      </h3>

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 gap-3 opacity-60 flex-1">
          <span className="text-text-muted text-2xl">
            <Icons.Info />
          </span>
          <p className="text-sm font-semibold text-text-primary">No activity yet</p>
          <p className="text-xs text-text-muted text-center max-w-[200px]">
            Upload a document or start an AI chat to see activity here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[215px] pr-1.5 custom-scrollbar">
          {activities.map((act) => {
            return (
              <button
                key={`${act.type}-${act.id}`}
                onClick={() => handleActivityClick(act.type)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover transition-all border border-transparent hover:border-border/30 w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span className="p-2.5 rounded-xl bg-surface border border-border text-primary shadow-sm flex-shrink-0">
                  {act.type === "document" && <Icons.Documents />}
                  {act.type === "chat" && <Icons.AI />}
                  {act.type === "department" && <Icons.Department />}
                  {act.type === "member" && <Icons.Users />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider">{act.title}</p>
                  <p className="text-sm font-semibold text-text-secondary truncate mt-0.5">{act.subtitle}</p>
                  <p className="text-[10px] text-text-muted mt-1 font-medium">{formatTimeAgo(act.timestamp)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
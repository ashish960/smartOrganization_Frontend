"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { Icons } from "@/constants/icons";
import Avatar from "@/components/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";

interface TopbarProps {
  title: string;
  subtitle?: string;
  userName: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  createdAt: string;
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

export default function Topbar({ title, subtitle, userName }: TopbarProps) {
  const router = useRouter();
  const { token } = useSelector((state: AppRootState) => state.auth);
  const { logoutUser } = useAuth();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"latest" | "history">("latest");
  const [latestNotifications, setLatestNotifications] = useState<NotificationItem[]>([]);
  const [historyNotifications, setHistoryNotifications] = useState<NotificationItem[]>([]);
  const [latestPage, setLatestPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [latestHasMore, setLatestHasMore] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchLatest = async (page = 1, append = false) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications?read=false&limit=5&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLatestNotifications(prev => append ? [...prev, ...data.data] : data.data);
        setLatestHasMore(data.pagination.hasMore);
        setUnreadCount(data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to load latest notifications", e);
    }
  };

  const fetchHistory = async (page = 1, append = false) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications?read=true&limit=5&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistoryNotifications(prev => append ? [...prev, ...data.data] : data.data);
        setHistoryHasMore(data.pagination.hasMore);
      }
    } catch (e) {
      console.error("Failed to load history notifications", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLatest(1, false);
      const interval = setInterval(() => fetchLatest(1, false), 20000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    setNotificationsOpen(false);
    if (!notif.read) {
      try {
        await fetch(`${API_BASE}/notifications/${notif._id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        setLatestNotifications(prev => prev.filter(n => n._id !== notif._id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = latestNotifications.find(n => n._id === id);
      if (found) {
        setLatestNotifications(prev => prev.filter(n => n._id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setHistoryNotifications(prev => [{ ...found, read: true }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id: string, fromTab: "latest" | "history") => {
    try {
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fromTab === "latest") {
        setLatestNotifications(prev => prev.filter(n => n._id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setHistoryNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const mapped = latestNotifications.map(n => ({ ...n, read: true }));
        setHistoryNotifications(prev => [...mapped, ...prev]);
        setLatestNotifications([]);
        setUnreadCount(0);
        setLatestHasMore(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await fetch(`${API_BASE}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setLatestNotifications([]);
      setHistoryNotifications([]);
      setUnreadCount(0);
      setLatestHasMore(false);
      setHistoryHasMore(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === "latest") {
      const nextPage = latestPage + 1;
      setLatestPage(nextPage);
      fetchLatest(nextPage, true);
    } else {
      const nextPage = historyPage + 1;
      setHistoryPage(nextPage);
      fetchHistory(nextPage, true);
    }
  };

  const activeList = activeTab === "latest" ? latestNotifications : historyNotifications;
  const activeHasMore = activeTab === "latest" ? latestHasMore : historyHasMore;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm font-medium text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setNotificationsOpen(prev => !prev);
              if (!notificationsOpen) {
                setLatestPage(1);
                setHistoryPage(1);
                fetchLatest(1, false);
                fetchHistory(1, false);
              }
            }}
            className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
          >
            <Icons.Bell />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold border-2 border-surface flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 mt-2 w-80 rounded-xl bg-surface border border-border p-2 shadow-xl z-50 animate-fade-in flex flex-col gap-2.5">
              
              <div className="flex items-center justify-between px-3 pt-2 pb-1 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[9px] font-bold">{unreadCount} unread</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[9px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {(latestNotifications.length > 0 || historyNotifications.length > 0) && (
                    <button 
                      onClick={handleClearAll}
                      className="text-[9px] font-bold text-error hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="flex border-b border-border/50 select-none">
                <button 
                  onClick={() => setActiveTab("latest")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition-colors ${
                    activeTab === "latest" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                  }`}
                >
                  Latest ({unreadCount})
                </button>
                <button 
                  onClick={() => {
                    setActiveTab("history");
                    fetchHistory(1, false);
                    setHistoryPage(1);
                  }}
                  className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition-colors ${
                    activeTab === "history" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
                  }`}
                >
                  History
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-1.5 min-h-[160px] max-h-[280px] custom-scrollbar">
                {activeList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-65 gap-1.5">
                    <span className="text-2xl">🔔</span>
                    <p className="text-xs font-semibold text-text-primary">
                      {activeTab === "latest" ? "All caught up!" : "No history alerts"}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {activeTab === "latest" ? "No new unread alerts" : "Read alerts appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {activeList.map((n) => (
                      <div 
                        key={n._id} 
                        className={`relative group/notif flex items-start gap-2.5 p-2 rounded-xl transition-all border border-transparent ${
                          n.read ? "bg-transparent hover:bg-surface-hover" : "bg-primary/5 hover:bg-primary/10 border-primary/10"
                        }`}
                      >
                        <button
                          onClick={() => handleNotificationClick(n)}
                          className="flex items-start gap-2.5 flex-1 text-left focus:outline-none min-w-0"
                        >
                          <span className="p-1.5 rounded-md bg-surface border border-border text-primary text-xs flex-shrink-0 mt-0.5 shadow-sm select-none">
                            {n.type === "DOCUMENT_UPLOAD" && "📂"}
                            {n.type === "DEPARTMENT_ADD" && "🏢"}
                            {n.type === "MEMBER_JOINED" && "👥"}
                            {(n.type === "SYSTEM" || n.type === "ALERT") && "⚠️"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{n.title}</p>
                            <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5 break-words">{n.message}</p>
                            <p className="text-[9px] text-text-muted mt-1.5 font-bold">{formatTimeAgo(new Date(n.createdAt))}</p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 ml-auto self-start mt-1 opacity-0 group-hover/notif:opacity-100 transition-opacity">
                          {!n.read && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkRead(n._id); }}
                              title="Mark read"
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-success hover:bg-success/15 transition-all font-bold cursor-pointer"
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n._id, activeTab); }}
                            title="Delete notification"
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-error hover:bg-error/15 transition-all font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2.5 mr-1 group-hover/notif:hidden" />
                        )}
                      </div>
                    ))}
                    
                    {activeHasMore && (
                      <button 
                        onClick={handleLoadMore}
                        className="py-2 text-center text-[10px] font-bold text-primary hover:underline cursor-pointer border-t border-border/50 mt-1 select-none"
                      >
                        Load More Alerts...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-primary/40 focus:ring-2 focus:ring-primary/40 transition-all focus:outline-none"
          >
            <Avatar name={userName} size={36} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 mt-2 w-48 rounded-xl bg-surface border border-border p-1.5 shadow-xl z-50 animate-fade-in flex flex-col gap-1">
              <div className="px-3 py-2 border-b border-border/50 mb-1 select-none">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Account</p>
                <p className="text-xs font-bold text-text-primary truncate mt-0.5">{userName}</p>
              </div>
              
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/settings");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My Profile
              </button>
              
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  logoutUser();
                  router.push("/auth/login");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-error/10 transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
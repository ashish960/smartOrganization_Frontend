"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface DocItem {
    _id: string;
    fileType: string;
    createdAt: string;
    uploadedBy: { _id: string; name: string; email: string } | null;
    department: { _id: string; name: string } | null;
}

interface MemberItem {
    _id: string;
    name: string;
    email: string;
    department: { _id: string; name: string } | null;
}

interface DeptItem {
    _id: string;
    name: string;
    icon: string;
}

interface OrgItem {
    usage?: { storageUsed?: number; aiQueriesUsed?: number };
    limits?: { maxStorage?: number };
}

interface AnalyticsData {
    overview: {
        totalDocuments: number;
        totalMembers: number;
        totalDepartments: number;
        aiQueriesUsed: number;
        storageUsed: number;
        storageLimit: number;
        documentsChange: number;
    };
    documentsOverTime: { date: string; count: number }[];
    aiQueriesOverTime: { date: string; count: number }[];
    documentsByDepartment: { name: string; count: number; color: string }[];
    documentsByType: { name: string; value: number; color: string }[];
    memberActivity: { name: string; documents: number; department: string }[];
    recentActivity: { action: string; user: string; target: string; time: string }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const DEPT_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];
const TYPE_COLORS = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

interface TooltipProps {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color, fontWeight: "600" }}>{p.name}: {p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

const buildAnalytics = (
    docs: DocItem[],
    members: MemberItem[],
    depts: DeptItem[],
    org: OrgItem,
    range: string,
    dept: string
): AnalyticsData => {
    const now = new Date();
    const days = range === "7days" ? 7 : range === "30days" ? 30 : range === "90days" ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filteredDocs = docs.filter(d => {
        const inDate = new Date(d.createdAt) >= cutoff;
        const inDept = dept === "all" || d.department?._id === dept || (!d.department && dept === "none");
        return inDate && inDept;
    });

    const docsByDay: Record<string, number> = {};
    const numDays = Math.min(days, 30);
    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        docsByDay[key] = 0;
    }
    filteredDocs.forEach(doc => {
        const key = new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (docsByDay[key] !== undefined) docsByDay[key]++;
    });
    const documentsOverTime = Object.entries(docsByDay).map(([date, count]) => ({ date, count }));

    const deptCounts: Record<string, number> = {};
    filteredDocs.forEach(doc => {
        const name = doc.department?.name || "No Department";
        deptCounts[name] = (deptCounts[name] || 0) + 1;
    });
    const documentsByDepartment = Object.entries(deptCounts).map(([name, count], i) => ({
        name, count, color: DEPT_COLORS[i % DEPT_COLORS.length]
    }));

    const typeCounts: Record<string, number> = {};
    filteredDocs.forEach(doc => {
        const t = doc.fileType?.toUpperCase() || "OTHER";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const documentsByType = Object.entries(typeCounts).map(([name, value], i) => ({
        name, value, color: TYPE_COLORS[i % TYPE_COLORS.length]
    }));

    const memberActivity = members.slice(0, 10).map(m => ({
        name: m.name,
        documents: filteredDocs.filter(d => d.uploadedBy?._id === m._id).length,
        department: m.department?.name || "No Department",
    })).sort((a, b) => b.documents - a.documents);

    const recentActivity = filteredDocs.slice(0, 10).map(doc => ({
        action: "Uploaded document",
        user: doc.uploadedBy?.name || "Unknown",
        target: "",
        time: new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    }));

    const aiQueriesOverTime = documentsOverTime.map(d => ({ date: d.date, count: Math.floor(d.count * 2.5) }));
    const storageUsed = org?.usage?.storageUsed || 0;
    const storageLimit = org?.limits?.maxStorage || 1073741824;

    return {
        overview: {
            totalDocuments: docs.length,
            totalMembers: members.length,
            totalDepartments: depts.length,
            aiQueriesUsed: org?.usage?.aiQueriesUsed || 0,
            storageUsed,
            storageLimit,
            documentsChange: filteredDocs.length,
        },
        documentsOverTime,
        aiQueriesOverTime,
        documentsByDepartment,
        documentsByType,
        memberActivity,
        recentActivity,
    };
};

export default function AnalyticsPage() {
    const { token } = useSelector((state: AppRootState) => state.auth);

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [departments, setDepartments] = useState<DeptItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30days");
    const [deptFilter, setDeptFilter] = useState("all");
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [docRes, membRes, deptRes, orgRes] = await Promise.all([
                    fetch(`${API_BASE}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/organization/members`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_BASE}/organization/me`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                const [docData, membData, deptData, orgData] = await Promise.all([
                    docRes.json(), membRes.json(), deptRes.json(), orgRes.json(),
                ]);
                if (cancelled) return;

                const docs = docData.success ? docData.data : [];
                const members = membData.success ? membData.data : [];
                const depts = deptData.success ? deptData.data : [];
                const org = orgData.success ? orgData.data : {};

                setDepartments(depts);
                setData(buildAnalytics(docs, members, depts, org, dateRange, deptFilter));
            } catch {
                if (!cancelled) setError("Failed to load analytics");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadData();
        return () => { cancelled = true; };
    }, [token, dateRange, deptFilter, refresh]);

    const selectStyle: React.CSSProperties = {
        padding: "8px 12px", borderRadius: "8px",
        background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
        color: "var(--color-text)", fontSize: "13px", cursor: "pointer", outline: "none",
    };

    if (isLoading) return (
        <DashboardLayout title="Analytics" subtitle="Track your organization's activity">
            <div style={{ display: "flex", justifyContent: "center", padding: "80px", opacity: 0.5 }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </DashboardLayout>
    );

    if (!data) return null;

    const storagePercent = Math.round((data.overview.storageUsed / data.overview.storageLimit) * 100);

    return (
        <DashboardLayout title="Analytics" subtitle="Track your organization's activity and usage">

            {error && <div style={{ marginBottom: "16px", padding: "12px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "14px" }}>❌ {error}</div>}

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: "600" }}>VIEW</span>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={selectStyle}>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="365days">Last Year</option>
                </select>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All Departments</option>
                    <option value="none">No Department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
                </select>
                <button onClick={() => setRefresh(p => p + 1)} style={{ padding: "8px 14px", borderRadius: "8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}>↻ Refresh</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                    { label: "Total Documents", value: data.overview.totalDocuments, sub: `+${data.overview.documentsChange} in period`, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", icon: "📄" },
                    { label: "Team Members", value: data.overview.totalMembers, sub: `${data.overview.totalDepartments} departments`, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: "👥" },
                    { label: "AI Queries", value: data.overview.aiQueriesUsed, sub: "Total queries made", color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", icon: "🤖" },
                    { label: "Storage Used", value: formatBytes(data.overview.storageUsed), sub: `${storagePercent}% of ${formatBytes(data.overview.storageLimit)}`, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "💾" },
                ].map(card => (
                    <div key={card.label} style={{ padding: "20px", borderRadius: "14px", background: card.bg, border: `1px solid ${card.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "20px" }}>{card.icon}</span>
                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "600" }}>{card.label}</span>
                        </div>
                        <p style={{ fontSize: "28px", fontWeight: "700", color: card.color, marginBottom: "4px" }}>{card.value}</p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>💾 Storage Usage</span>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{formatBytes(data.overview.storageUsed)} / {formatBytes(data.overview.storageLimit)}</span>
                </div>
                <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "4px", transition: "width 0.5s ease", width: `${Math.min(storagePercent, 100)}%`, background: storagePercent > 80 ? "#ef4444" : storagePercent > 60 ? "#f59e0b" : "linear-gradient(135deg, #3b82f6, #a855f7)" }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "6px" }}>{storagePercent}% used</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>📄 Documents Uploaded</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data.documentsOverTime}>
                            <defs>
                                <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" name="Documents" stroke="#3b82f6" strokeWidth={2} fill="url(#docGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>🤖 AI Queries</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data.aiQueriesOverTime}>
                            <defs>
                                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" name="Queries" stroke="#a855f7" strokeWidth={2} fill="url(#aiGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>🏢 Documents by Department</h3>
                    {data.documentsByDepartment.length === 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", opacity: 0.4 }}>
                            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No data yet</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.documentsByDepartment} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Documents" radius={[0, 4, 4, 0]}>
                                    {data.documentsByDepartment.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>📊 Documents by File Type</h3>
                    {data.documentsByType.length === 0 ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", opacity: 0.4 }}>
                            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No data yet</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={data.documentsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {data.documentsByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {data.documentsByType.map((item, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: "12px" }}>{item.name}</span>
                                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "auto" }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px" }}>👥 Member Activity</h3>
                {data.memberActivity.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", opacity: 0.5 }}>No activity yet</p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.memberActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }} />
                            <Bar dataKey="documents" name="Documents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>🕐 Recent Activity</h3>
                {data.recentActivity.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)", opacity: 0.5 }}>No recent activity</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {data.recentActivity.map((activity, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: i < data.recentActivity.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: "13px", fontWeight: "600" }}>
                                        <span style={{ color: "#3b82f6" }}>{activity.user}</span> {activity.action}
                                    </p>
                                </div>
                                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", flexShrink: 0 }}>{activity.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </DashboardLayout>
    );
}
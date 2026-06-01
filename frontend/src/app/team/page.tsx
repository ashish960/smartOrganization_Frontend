"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";

// ── Types ──────────────────────────────────────────────────────────────────
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  department: { _id: string; name: string; code: string; icon: string } | null;
  lastLogin: string | null;
  createdAt: string;
  isEmailVerified: boolean;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  icon: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Helpers ────────────────────────────────────────────────────────────────
const getRoleStyle = (role: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ORG_ADMIN:    { bg: "rgba(168,85,247,0.12)", color: "#a855f7", label: "Org Admin"    },
    DEPT_MANAGER: { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", label: "Dept Manager" },
    USER:         { bg: "rgba(16,185,129,0.12)",  color: "#10b981", label: "User"         },
    VIEWER:       { bg: "rgba(107,114,128,0.12)", color: "#9ca3af", label: "Viewer"       },
    SUPER_ADMIN:  { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", label: "Super Admin"  },
  };
  return map[role] ?? { bg: "rgba(107,114,128,0.12)", color: "#9ca3af", label: role };
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
};

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--color-surface)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { token, user } = useSelector((state: AppRootState) => state.auth);

  const [members, setMembers]           = useState<TeamMember[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [deptFilter, setDeptFilter]     = useState("all");
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);
  const [refresh, setRefresh]           = useState(0);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showProfile, setShowProfile]   = useState(false);
  const [removingId, setRemovingId]     = useState<string | null>(null);

  const isAdmin = (user as { role?: string } | null)?.role === "ORG_ADMIN";

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };
  const showError   = (msg: string) => { setError(msg);   setTimeout(() => setError(null),   4000); };

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [membRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/organization/members`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/departments`,           { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [membData, deptData] = await Promise.all([membRes.json(), deptRes.json()]);
        if (!cancelled) {
          if (membData.success) setMembers(membData.data);
          if (deptData.success) setDepartments(deptData.data);
        }
      } catch { if (!cancelled) showError("Failed to load team"); }
      finally  { if (!cancelled) setIsLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  // ── Remove member ──────────────────────────────────────────────────────
  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    setRemovingId(memberId);
    try {
      const res  = await fetch(`${API_BASE}/organization/members/${memberId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { showSuccess("Member removed"); setRefresh(p => p + 1); setShowProfile(false); }
      else throw new Error(data.message);
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed to remove"); }
    finally { setRemovingId(null); }
  };

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = members.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (deptFilter !== "all" && m.department?._id !== deptFilter) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: "8px",
    background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
    color: "var(--color-text)", fontSize: "13px", cursor: "pointer", outline: "none",
  };

  return (
    <DashboardLayout title="Team" subtitle="Manage your organization's members">

      {success && <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "14px", fontWeight: "500" }}>✅ {success}</div>}
      {error   && <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.15)",   border: "1px solid rgba(239,68,68,0.3)",   color: "#ef4444", fontSize: "14px", fontWeight: "500" }}>❌ {error} <button onClick={() => setError(null)} style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button></div>}

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: "200px", maxWidth: "340px", padding: "10px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: "14px", outline: "none" }} />
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "600" }}>FILTER BY</span>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Roles</option>
          <option value="ORG_ADMIN">Org Admin</option>
          <option value="DEPT_MANAGER">Dept Manager</option>
          <option value="USER">User</option>
          <option value="VIEWER">Viewer</option>
        </select>

        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Departments</option>
          <option value="none">No Department</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
          ))}
        </select>

        {(roleFilter !== "all" || deptFilter !== "all") && (
          <button onClick={() => { setRoleFilter("all"); setDeptFilter("all"); }} style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontWeight: "600" }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Members",  value: members.length,                                          color: "#3b82f6" },
          { label: "Admins",         value: members.filter(m => m.role === "ORG_ADMIN").length,      color: "#a855f7" },
          { label: "Managers",       value: members.filter(m => m.role === "DEPT_MANAGER").length,   color: "#f59e0b" },
          { label: "Showing",        value: filtered.length,                                         color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "12px 20px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Member grid ── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite" }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "16px", opacity: 0.5 }}>
          <span style={{ fontSize: "48px" }}>👥</span>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>No members found</p>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map((member) => {
            const roleStyle = getRoleStyle(member.role);
            const isCurrentUser = (user as { id?: string } | null)?.id === member._id;
            return (
              <div key={member._id} style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: isCurrentUser ? "1px solid rgba(59,130,246,0.3)" : "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "12px", transition: "all 0.2s ease", position: "relative" }}>

                {isCurrentUser && (
                  <span style={{ position: "absolute", top: "12px", right: "12px", fontSize: "10px", padding: "2px 7px", borderRadius: "5px", background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontWeight: "600" }}>YOU</span>
                )}

                {/* Avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>
                    {getInitials(member.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.email}</p>
                  </div>
                </div>

                {/* Role badge */}
                <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", fontWeight: "600", background: roleStyle.bg, color: roleStyle.color, alignSelf: "flex-start" }}>
                  {roleStyle.label}
                </span>

                {/* Job title */}
                {member.jobTitle && (
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>💼 {member.jobTitle}</p>
                )}

                {/* Department */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "14px" }}>{member.department?.icon ?? "🏢"}</span>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "600" }}>{member.department?.name ?? "No Department"}</p>
                    {member.department && <p style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{member.department.code}</p>}
                  </div>
                </div>

                {/* Last login */}
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Last login: {formatDate(member.lastLogin)}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <button onClick={() => { setSelectedMember(member); setShowProfile(true); }} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                    View Profile
                  </button>
                  {isAdmin && !isCurrentUser && (
                    <button onClick={() => handleRemove(member._id)} disabled={removingId === member._id} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                      {removingId === member._id ? "..." : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Profile Modal ── */}
      {showProfile && selectedMember && (
        <Modal onClose={() => { setShowProfile(false); setSelectedMember(null); }}>
          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "700", color: "#fff" }}>
              {getInitials(selectedMember.name)}
            </div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{selectedMember.name}</h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{selectedMember.email}</p>
            </div>
            <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "8px", fontWeight: "600", background: getRoleStyle(selectedMember.role).bg, color: getRoleStyle(selectedMember.role).color }}>
              {getRoleStyle(selectedMember.role).label}
            </span>
          </div>

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Job Title",       value: selectedMember.jobTitle ?? "Not set"                     },
              { label: "Department",      value: selectedMember.department?.name ?? "None"                },
              { label: "Email Verified",  value: selectedMember.isEmailVerified ? "✅ Yes" : "❌ No"      },
              { label: "Member Since",    value: formatDate(selectedMember.createdAt)                     },
              { label: "Last Login",      value: formatDate(selectedMember.lastLogin)                     },
              { label: "Dept Code",       value: selectedMember.department?.code ?? "—"                  },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{item.label}</p>
                <p style={{ fontSize: "13px", fontWeight: "600" }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setShowProfile(false); setSelectedMember(null); }} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Close</button>
            {isAdmin && (user as { id?: string } | null)?.id !== selectedMember._id && (
              <button onClick={() => handleRemove(selectedMember._id)} disabled={removingId === selectedMember._id} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                {removingId === selectedMember._id ? "Removing..." : "Remove Member"}
              </button>
            )}
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
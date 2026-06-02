"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";

// ── Types ──────────────────────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface OrgMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: { _id: string; name: string } | null;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  head: Member | null;
  members: Member[];
  permissions: { documentVisibility: string; canAccessDepartments: string[] };
  isMandatory: boolean;
  isFromTemplate: boolean;
  createdAt: string;
}

interface Template {
  _id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
}

type ModalType = "none" | "create-template" | "create-custom" | "view" | "add-member" | "access-matrix";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    ORG_ADMIN:    { bg: "rgba(168,85,247,0.1)",  color: "#a855f7" },
    DEPT_MANAGER: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
    USER:         { bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
    VIEWER:       { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  };
  return styles[role] ?? { bg: "rgba(107,114,128,0.1)", color: "#6b7280" };
};

const getVisibilityStyle = (v: string) => {
  if (v === "PUBLIC")     return { color: "#10b981", bg: "rgba(16,185,129,0.1)" };
  if (v === "RESTRICTED") return { color: "#ef4444", bg: "rgba(239,68,68,0.1)"  };
  return                         { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" };
};

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--color-surface)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
  color: "var(--color-text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
};

export default function DepartmentsPage() {
  const { token } = useSelector((state: AppRootState) => state.auth);

  const [departments, setDepartments]   = useState<Department[]>([]);
  const [templates, setTemplates]       = useState<Template[]>([]);
  const [orgMembers, setOrgMembers]     = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [modal, setModal]               = useState<ModalType>("none");
  const [selected, setSelected]         = useState<Department | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [success, setSuccess]           = useState<string | null>(null);
  const [refresh, setRefresh]           = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [customForm, setCustomForm]     = useState({ name: "", code: "", icon: "📁", description: "" });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isSaving, setIsSaving]         = useState(false);
  const [accessDeptIds, setAccessDeptIds] = useState<string[]>([]); // ← MOVED INSIDE component

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };
  const showError   = (msg: string) => { setError(msg);   setTimeout(() => setError(null),   4000); };
  const closeModal  = () => {
    setModal("none"); setSelected(null);
    setCustomForm({ name: "", code: "", icon: "📁", description: "" });
    setSelectedTemplateId(""); setSelectedUserId(""); setMemberSearch("");
    setAccessDeptIds([]);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [deptRes, tmplRes, membRes] = await Promise.all([
          fetch(`${API_BASE}/departments`,           { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/departments/templates`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/organization/members`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [deptData, tmplData, membData] = await Promise.all([deptRes.json(), tmplRes.json(), membRes.json()]);
        if (!cancelled) {
          if (deptData.success) setDepartments(deptData.data);
          if (tmplData.success) setTemplates(tmplData.data);
          if (membData.success) setOrgMembers(membData.data);
        }
      } catch { if (!cancelled) showError("Failed to load departments"); }
      finally  { if (!cancelled) setIsLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplateId) return showError("Please select a template");
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/departments/create-from-template`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ templateId: selectedTemplateId }) });
      const data = await res.json();
      if (data.success) { showSuccess("Department created!"); setRefresh(p => p + 1); closeModal(); }
      else throw new Error(data.message);
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleCreateCustom = async () => {
    if (!customForm.name || !customForm.code) return showError("Name and code are required");
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/departments/create-custom`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(customForm) });
      const data = await res.json();
      if (data.success) { showSuccess("Department created!"); setRefresh(p => p + 1); closeModal(); }
      else throw new Error(data.message);
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !selected) return showError("Please select a member");
    if (selected.members.some(m => m._id === selectedUserId)) return showError("User is already a member of this department");
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/departments/${selected._id}/add-member`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedUserId }) });
      const data = await res.json();
      if (data.success) { showSuccess("Member added!"); setRefresh(p => p + 1); closeModal(); }
      else throw new Error(data.message);
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed"); }
    finally { setIsSaving(false); }
  };

  const handleRemoveMember = async (deptId: string, userId: string) => {
    if (!confirm("Remove this member from the department?")) return;
    try {
        const res = await fetch(`${API_BASE}/departments/${deptId}/remove-member/${userId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            showSuccess("Member removed!");
            setRefresh(p => p + 1);
            closeModal();
        } else throw new Error(data.message);
    } catch (err: unknown) {
        showError(err instanceof Error ? err.message : "Failed to remove");
    }
};
  const handleUpdateAccessMatrix = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/departments/${selected._id}/access-matrix`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ allowedDepartments: accessDeptIds }) });
      const data = await res.json();
      if (data.success) { showSuccess("Access matrix updated!"); setRefresh(p => p + 1); closeModal(); }
      else throw new Error(data.message);
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed"); }
    finally { setIsSaving(false); }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableMembers = orgMembers.filter(m => {
    const alreadyIn = selected?.members.some(dm => dm._id === m._id);
    if (alreadyIn) return false;
    if (!memberSearch) return true;
    return m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
           m.email.toLowerCase().includes(memberSearch.toLowerCase());
  });

  return (
    <DashboardLayout title="Departments" subtitle="Manage your organization's departments and teams">

      {success && <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "14px", fontWeight: "500" }}>✅ {success}</div>}
      {error   && <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 999, padding: "12px 20px", borderRadius: "10px", background: "rgba(239,68,68,0.15)",   border: "1px solid rgba(239,68,68,0.3)",   color: "#ef4444", fontSize: "14px", fontWeight: "500" }}>❌ {error} <button onClick={() => setError(null)} style={{ marginLeft: "12px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button></div>}

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: "200px", maxWidth: "340px", padding: "10px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: "14px", outline: "none" }} />
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setModal("create-template")} style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>+ From Template</button>
          <button onClick={() => setModal("create-custom")} className="gradient-button" style={{ padding: "10px 18px", fontSize: "14px" }}>+ Custom Department</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Departments", value: departments.length,                                     color: "#3b82f6" },
          { label: "Total Members",     value: departments.reduce((s, d) => s + d.members.length, 0), color: "#10b981" },
          { label: "From Templates",    value: departments.filter(d => d.isFromTemplate).length,      color: "#a855f7" },
          { label: "Custom",            value: departments.filter(d => !d.isFromTemplate).length,     color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "12px 20px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", fontWeight: "700", color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite" }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "16px", opacity: 0.5 }}>
          <span style={{ fontSize: "48px" }}>🏢</span>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>{searchQuery ? "No departments found" : "No departments yet"}</p>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>{searchQuery ? "Try a different search" : "Create your first department"}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filtered.map((dept) => {
            const visStyle = getVisibilityStyle(dept.permissions.documentVisibility);
            return (
              <div key={dept._id} style={{ padding: "20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ fontSize: "32px", lineHeight: 1 }}>{dept.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "15px", fontWeight: "700" }}>{dept.name}</p>
                      {dept.isMandatory && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "5px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: "600" }}>MANDATORY</span>}
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>Code: <strong>{dept.code}</strong></p>
                  </div>
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", fontWeight: "600", background: visStyle.bg, color: visStyle.color, whiteSpace: "nowrap" }}>{dept.permissions.documentVisibility}</span>
                </div>

                {dept.description && <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{dept.description}</p>}

                {dept.head && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)" }}>
                    <span style={{ fontSize: "12px" }}>👑</span>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: "600" }}>{dept.head.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Department Head</p>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "600" }}>MEMBERS ({dept.members.length})</span>
                    <button onClick={() => { setSelected(dept); setModal("add-member"); }} style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", cursor: "pointer", fontWeight: "600" }}>+ Add</button>
                  </div>
                  {dept.members.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)", opacity: 0.5 }}>No members yet</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {dept.members.slice(0, 3).map((m) => {
                        const rs = getRoleBadgeStyle(m.role);
                        return (
                          <div key={m._id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>
                              {m.name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</p>
                            </div>
                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "5px", fontWeight: "600", background: rs.bg, color: rs.color, whiteSpace: "nowrap" }}>{m.role.replace("_", " ")}</span>
                          </div>
                        );
                      })}
                      {dept.members.length > 3 && <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>+{dept.members.length - 3} more</p>}
                    </div>
                  )}
                </div>

                {/* Cross-access badge */}
                {dept.permissions.canAccessDepartments.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "7px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                    <span style={{ fontSize: "11px" }}>🔗</span>
                    <span style={{ fontSize: "11px", color: "#a855f7", fontWeight: "600" }}>
                      Cross-access: {dept.permissions.canAccessDepartments.length} dept{dept.permissions.canAccessDepartments.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                  <button onClick={() => { setSelected(dept); setModal("view"); }} style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>View Details</button>
                  <button
                    onClick={() => {
                      setSelected(dept);
                      setAccessDeptIds(dept.permissions.canAccessDepartments as unknown as string[]);
                      setModal("access-matrix");
                    }}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Access Matrix
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create from Template */}
      {modal === "create-template" && (
        <Modal onClose={closeModal}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Create from Template</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>Choose a pre-built department template</p>
          {templates.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>No templates available</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {templates.map((t) => (
                <div key={t._id} onClick={() => setSelectedTemplateId(t._id)} style={{ padding: "14px 16px", borderRadius: "10px", cursor: "pointer", border: selectedTemplateId === t._id ? "2px solid #3b82f6" : "1px solid var(--color-border)", background: selectedTemplateId === t._id ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.15s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{t.icon}</span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600" }}>{t.name}</p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button onClick={handleCreateFromTemplate} disabled={isSaving || !selectedTemplateId} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>{isSaving ? "Creating..." : "Create Department"}</button>
          </div>
        </Modal>
      )}

      {/* Modal: Create Custom */}
      {modal === "create-custom" && (
        <Modal onClose={closeModal}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Create Custom Department</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>Build a department from scratch</p>
          <Field label="Icon"><input value={customForm.icon} onChange={(e) => setCustomForm(p => ({ ...p, icon: e.target.value }))} style={{ ...inputStyle, maxWidth: "80px" }} placeholder="📁" /></Field>
          <Field label="Department Name *"><input value={customForm.name} onChange={(e) => setCustomForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. Marketing" /></Field>
          <Field label="Department Code *">
            <input value={customForm.code} onChange={(e) => setCustomForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} style={inputStyle} placeholder="e.g. MKT" maxLength={10} />
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Short unique code, letters only</p>
          </Field>
          <Field label="Description"><textarea value={customForm.description} onChange={(e) => setCustomForm(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" } as React.CSSProperties} placeholder="What does this department do?" /></Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button onClick={handleCreateCustom} disabled={isSaving} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>{isSaving ? "Creating..." : "Create Department"}</button>
          </div>
        </Modal>
      )}

      {/* Modal: View Details */}
      {modal === "view" && selected && (
        <Modal onClose={closeModal}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <span style={{ fontSize: "40px" }}>{selected.icon}</span>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{selected.name}</h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Code: {selected.code}</p>
            </div>
          </div>
          {selected.description && <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>{selected.description}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Members",        value: selected.members.length },
              { label: "Type",           value: selected.isFromTemplate ? "Template" : "Custom" },
              { label: "Doc Visibility", value: selected.permissions.documentVisibility },
              { label: "Mandatory",      value: selected.isMandatory ? "Yes" : "No" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{item.label}</p>
                <p style={{ fontSize: "14px", fontWeight: "600" }}>{item.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)", marginBottom: "10px" }}>ALL MEMBERS</p>
          {selected.members.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", opacity: 0.5 }}>No members yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selected.members.map((m) => {
    const rs = getRoleBadgeStyle(m.role);
    return (
        <div key={m._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#fff" }}>
                {m.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: "600" }}>{m.name}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{m.email}</p>
            </div>
            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "5px", fontWeight: "600", background: rs.bg, color: rs.color }}>
                {m.role.replace("_", " ")}
            </span>
            <button
                onClick={() => handleRemoveMember(selected._id, m._id)}
                style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}
            >
                Remove
            </button>
        </div>
    );
})}
            </div>
          )}
          <button onClick={closeModal} style={{ width: "100%", marginTop: "20px", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Close</button>
        </Modal>
      )}

      {/* Modal: Add Member */}
      {modal === "add-member" && selected && (
        <Modal onClose={closeModal}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Add Member</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>Add a member to <strong>{selected.name}</strong></p>
          <Field label="Search Members">
            <input value={memberSearch} onChange={(e) => { setMemberSearch(e.target.value); setSelectedUserId(""); }} style={inputStyle} placeholder="Search by name or email..." autoFocus />
          </Field>
          <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {availableMembers.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", opacity: 0.5 }}>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{memberSearch ? "No members match your search" : "All org members are already in this department"}</p>
              </div>
            ) : (
              availableMembers.map((m) => {
                const rs = getRoleBadgeStyle(m.role);
                const isSelected = selectedUserId === m._id;
                return (
                  <div key={m._id} onClick={() => setSelectedUserId(m._id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", cursor: "pointer", border: isSelected ? "2px solid #3b82f6" : "1px solid var(--color-border)", background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.15s ease" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#fff", flexShrink: 0 }}>{m.name?.[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p>
                      {m.department && <p style={{ fontSize: "10px", color: "#f59e0b", marginTop: "2px" }}>Currently in: {m.department.name}</p>}
                    </div>
                    <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "5px", fontWeight: "600", background: rs.bg, color: rs.color, whiteSpace: "nowrap" }}>{m.role.replace("_", " ")}</span>
                    {isSelected && <span style={{ color: "#3b82f6", fontSize: "16px" }}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
          {selectedUserId && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#10b981" }}>✓ Selected: <strong>{orgMembers.find(m => m._id === selectedUserId)?.name}</strong></p>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button onClick={handleAddMember} disabled={isSaving || !selectedUserId} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>{isSaving ? "Adding..." : "Add Member"}</button>
          </div>
        </Modal>
      )}

      {/* Modal: Access Matrix */}
      {modal === "access-matrix" && selected && (
        <Modal onClose={closeModal}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Cross-Department Access</h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
            Members of <strong>{selected.name}</strong> can also read documents from:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", maxHeight: "300px", overflowY: "auto" }}>
            {departments.filter(d => d._id !== selected._id).length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", opacity: 0.5, textAlign: "center", padding: "20px" }}>No other departments yet</p>
            ) : (
              departments.filter(d => d._id !== selected._id).map(d => {
                const isChecked = accessDeptIds.includes(d._id);
                return (
                  <div
                    key={d._id}
                    onClick={() => setAccessDeptIds(prev => isChecked ? prev.filter(id => id !== d._id) : [...prev, d._id])}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", cursor: "pointer", border: isChecked ? "2px solid #a855f7" : "1px solid var(--color-border)", background: isChecked ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)", transition: "all 0.15s ease" }}
                  >
                    <span style={{ fontSize: "20px" }}>{d.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: "600" }}>{d.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{d.code}</p>
                    </div>
                    <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: isChecked ? "2px solid #a855f7" : "2px solid var(--color-border)", background: isChecked ? "#a855f7" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#fff", flexShrink: 0 }}>
                      {isChecked && "✓"}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {accessDeptIds.length > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#a855f7" }}>✓ Access granted to {accessDeptIds.length} department{accessDeptIds.length > 1 ? "s" : ""}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
            <button onClick={handleUpdateAccessMatrix} disabled={isSaving} className="gradient-button" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>{isSaving ? "Saving..." : "Save Access"}</button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
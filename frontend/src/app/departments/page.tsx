"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import Button from "@/components/ui/Button";

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
  const styles: Record<string, string> = {
    ORG_ADMIN:    "bg-secondary/10 text-secondary border border-secondary/20",
    DEPT_MANAGER: "bg-primary/10 text-primary border border-primary/20",
    USER:         "bg-success/10 text-success border border-success/20",
    VIEWER:       "bg-text-muted/10 text-text-muted border border-border",
  };
  return styles[role] ?? "bg-text-muted/10 text-text-muted border border-border";
};

const getVisibilityStyle = (v: string) => {
  if (v === "PUBLIC")     return "bg-success/10 text-success border border-success/20";
  if (v === "RESTRICTED") return "bg-error/10 text-error border border-error/20";
  return                         "bg-primary/10 text-primary border border-primary/20";
};

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border p-7 w-full max-w-[500px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

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
  const [accessDeptIds, setAccessDeptIds] = useState<string[]>([]);

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
    if (token) load();
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

      {success && <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium backdrop-blur-md shadow-lg">✅ {success}</div>}
      {error   && <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium backdrop-blur-md shadow-lg">❌ {error} <button onClick={() => setError(null)} className="ml-3 text-error hover:opacity-80">✕</button></div>}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <input type="text" placeholder="Search departments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] max-w-[340px] px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm" />
        <div className="flex gap-2">
          <Button onClick={() => setModal("create-template")} variant="secondary" size="sm">+ From Template</Button>
          <Button onClick={() => setModal("create-custom")} variant="primary" size="sm">+ Custom Department</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: "Total Departments", value: departments.length,                                     color: "text-primary", bg: "bg-primary/5" },
          { label: "Total Members",     value: departments.reduce((s, d) => s + d.members.length, 0), color: "text-success", bg: "bg-success/5" },
          { label: "From Templates",    value: departments.filter(d => d.isFromTemplate).length,      color: "text-secondary", bg: "bg-secondary/5" },
          { label: "Custom",            value: departments.filter(d => !d.isFromTemplate).length,     color: "text-warning", bg: "bg-warning/5" },
        ].map((s) => (
          <div key={s.label} className={`px-5 py-3 rounded-xl ${s.bg} border border-border flex items-center gap-3 backdrop-blur-sm shadow-sm`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-sm font-medium text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20 opacity-50">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-4 opacity-50">
          <span className="text-5xl">🏢</span>
          <p className="text-lg font-semibold text-text-primary">{searchQuery ? "No departments found" : "No departments yet"}</p>
          <p className="text-sm text-text-muted">{searchQuery ? "Try a different search" : "Create your first department"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dept) => {
            const visClass = getVisibilityStyle(dept.permissions.documentVisibility);
            return (
              <div key={dept._id} className="p-5 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{dept.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-text-primary truncate">{dept.name}</p>
                      {dept.isMandatory && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning font-bold tracking-wider">MANDATORY</span>}
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">Code: <strong className="text-text-primary">{dept.code}</strong></p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${visClass}`}>{dept.permissions.documentVisibility}</span>
                </div>

                {dept.description && <p className="text-xs text-text-muted leading-relaxed truncate-2-lines">{dept.description}</p>}

                {dept.head && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                    <span className="text-sm">👑</span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{dept.head.name}</p>
                      <p className="text-[10px] text-text-muted">Department Head</p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted tracking-wider">MEMBERS ({dept.members.length})</span>
                    <button onClick={() => { setSelected(dept); setModal("add-member"); }} className="text-[10px] px-2 py-0.5 rounded-md bg-success/15 border border-success/30 text-success font-semibold hover:bg-success/20 transition-colors">+ Add</button>
                  </div>
                  {dept.members.length === 0 ? (
                    <p className="text-xs text-text-muted italic opacity-65">No members yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dept.members.slice(0, 3).map((m) => {
                        const rsClass = getRoleBadgeStyle(m.role);
                        return (
                          <div key={m._id} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                              {m.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text-primary truncate">{m.name}</p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${rsClass}`}>{m.role.replace("_", " ")}</span>
                          </div>
                        );
                      })}
                      {dept.members.length > 3 && <p className="text-[10px] text-text-muted font-medium">+{dept.members.length - 3} more</p>}
                    </div>
                  )}
                </div>

                {/* Cross-access badge */}
                {dept.permissions.canAccessDepartments.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/5 border border-secondary/15">
                    <span className="text-xs">🔗</span>
                    <span className="text-[10px] text-secondary font-semibold">
                      Cross-access: {dept.permissions.canAccessDepartments.length} dept{dept.permissions.canAccessDepartments.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  <Button onClick={() => { setSelected(dept); setModal("view"); }} variant="secondary" size="sm" className="flex-1">View Details</Button>
                  <Button
                    onClick={() => {
                      setSelected(dept);
                      setAccessDeptIds(dept.permissions.canAccessDepartments as unknown as string[]);
                      setModal("access-matrix");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Access Matrix
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create from Template */}
      {modal === "create-template" && (
        <Modal onClose={closeModal}>
          <h2 className="text-lg font-bold text-text-primary mb-1">Create from Template</h2>
          <p className="text-xs text-text-muted mb-5">Choose a pre-built department template</p>
          {templates.length === 0 ? (
            <p className="text-sm text-text-muted">No templates available</p>
          ) : (
            <div className="flex flex-col gap-2.5 mb-5">
              {templates.map((t) => (
                <div key={t._id} onClick={() => setSelectedTemplateId(t._id)} className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTemplateId === t._id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-surface hover:bg-surface-hover"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{t.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{t.name}</p>
                      <p className="text-xs text-text-muted truncate">{t.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={closeModal} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={handleCreateFromTemplate} disabled={isSaving || !selectedTemplateId} className="flex-1">{isSaving ? "Creating..." : "Create Department"}</Button>
          </div>
        </Modal>
      )}

      {/* Modal: Create Custom */}
      {modal === "create-custom" && (
        <Modal onClose={closeModal}>
          <h2 className="text-lg font-bold text-text-primary mb-1">Create Custom Department</h2>
          <p className="text-xs text-text-muted mb-5">Build a department from scratch</p>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="col-span-1">
              <Field label="Icon">
                <input value={customForm.icon} onChange={(e) => setCustomForm(p => ({ ...p, icon: e.target.value }))} className="dark-input" placeholder="📁" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Department Name *">
                <input value={customForm.name} onChange={(e) => setCustomForm(p => ({ ...p, name: e.target.value }))} className="dark-input" placeholder="e.g. Marketing" />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Department Code *">
                <input value={customForm.code} onChange={(e) => setCustomForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="dark-input" placeholder="e.g. MKT" maxLength={10} />
                <p className="text-[10px] text-text-muted mt-1">Short unique code, letters only</p>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Description">
                <textarea value={customForm.description} onChange={(e) => setCustomForm(p => ({ ...p, description: e.target.value }))} className="dark-input min-h-[80px] resize-y" placeholder="What does this department do?" />
              </Field>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={closeModal} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={handleCreateCustom} disabled={isSaving} className="flex-1">{isSaving ? "Creating..." : "Create Department"}</Button>
          </div>
        </Modal>
      )}

      {/* Modal: View Details */}
      {modal === "view" && selected && (
        <Modal onClose={closeModal}>
          <div className="flex items-center gap-3.5 mb-5">
            <span className="text-4xl">{selected.icon}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-text-primary truncate">{selected.name}</h2>
              <p className="text-xs text-text-muted">Code: {selected.code}</p>
            </div>
          </div>
          
          {selected.description && <p className="text-sm text-text-secondary leading-relaxed mb-5">{selected.description}</p>}
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Members",        value: selected.members.length },
              { label: "Type",           value: selected.isFromTemplate ? "Template" : "Custom" },
              { label: "Doc Visibility", value: selected.permissions.documentVisibility },
              { label: "Mandatory",      value: selected.isMandatory ? "Yes" : "No" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-surface border border-border">
                <p className="text-[10px] text-text-muted mb-1 font-bold">{item.label}</p>
                <p className="text-sm font-bold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
          
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2.5">ALL MEMBERS</p>
          {selected.members.length === 0 ? (
            <p className="text-xs text-text-muted italic opacity-60">No members yet</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {selected.members.map((m) => {
                const rsClass = getRoleBadgeStyle(m.role);
                return (
                  <div key={m._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{m.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{m.email}</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${rsClass} mr-2`}>
                      {m.role.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(selected._id, m._id)}
                      className="px-2 py-1 rounded bg-error/10 border border-error/20 text-error text-[10px] hover:bg-error/20 font-bold transition-all"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Button onClick={closeModal} variant="secondary" className="w-full mt-5">Close</Button>
        </Modal>
      )}

      {/* Modal: Add Member */}
      {modal === "add-member" && selected && (
        <Modal onClose={closeModal}>
          <h2 className="text-lg font-bold text-text-primary mb-1">Add Member</h2>
          <p className="text-xs text-text-muted mb-4">Add a member to <strong>{selected.name}</strong></p>
          <Field label="Search Members">
            <input value={memberSearch} onChange={(e) => { setMemberSearch(e.target.value); setSelectedUserId(""); }} className="dark-input" placeholder="Search by name or email..." autoFocus />
          </Field>
          <div className="max-h-[260px] overflow-y-auto mb-4 flex flex-col gap-2">
            {availableMembers.length === 0 ? (
              <div className="py-8 text-center opacity-60">
                <p className="text-xs text-text-muted">{memberSearch ? "No members match your search" : "All org members are already in this department"}</p>
              </div>
            ) : (
              availableMembers.map((m) => {
                const rsClass = getRoleBadgeStyle(m.role);
                const isSelected = selectedUserId === m._id;
                return (
                  <div key={m._id} onClick={() => setSelectedUserId(m._id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-surface-hover"}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">{m.name?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{m.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{m.email}</p>
                      {m.department && <p className="text-[9px] text-warning mt-0.5">Currently in: {m.department.name}</p>}
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-medium ${rsClass}`}>{m.role.replace("_", " ")}</span>
                    {isSelected && <span className="text-primary font-bold text-sm ml-1">✓</span>}
                  </div>
                );
              })
            )}
          </div>
          {selectedUserId && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 mb-4 text-xs text-success font-medium">
              ✓ Selected: <strong>{orgMembers.find(m => m._id === selectedUserId)?.name}</strong>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={closeModal} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={handleAddMember} disabled={isSaving || !selectedUserId} className="flex-1">{isSaving ? "Adding..." : "Add Member"}</Button>
          </div>
        </Modal>
      )}

      {/* Modal: Access Matrix */}
      {modal === "access-matrix" && selected && (
        <Modal onClose={closeModal}>
          <h2 className="text-lg font-bold text-text-primary mb-1">Cross-Department Access</h2>
          <p className="text-xs text-text-muted mb-4">
            Members of <strong>{selected.name}</strong> can also read documents from:
          </p>

          <div className="flex flex-col gap-2 mb-4 max-h-[300px] overflow-y-auto">
            {departments.filter(d => d._id !== selected._id).length === 0 ? (
              <p className="text-xs text-text-muted text-center py-5 opacity-60">No other departments yet</p>
            ) : (
              departments.filter(d => d._id !== selected._id).map(d => {
                const isChecked = accessDeptIds.includes(d._id);
                return (
                  <div
                    key={d._id}
                    onClick={() => setAccessDeptIds(prev => isChecked ? prev.filter(id => id !== d._id) : [...prev, d._id])}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isChecked ? "border-secondary bg-secondary/5" : "border-border bg-surface hover:bg-surface-hover"}`}
                  >
                    <span className="text-2xl flex-shrink-0">{d.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{d.name}</p>
                      <p className="text-[10px] text-text-muted">{d.code}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold transition-all ${isChecked ? "border-secondary bg-secondary text-white" : "border-border bg-transparent"}`}>
                      {isChecked && "✓"}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {accessDeptIds.length > 0 && (
            <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 mb-4 text-xs text-secondary font-medium">
              ✓ Access granted to {accessDeptIds.length} department{accessDeptIds.length > 1 ? "s" : ""}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={closeModal} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={handleUpdateAccessMatrix} disabled={isSaving} className="flex-1">{isSaving ? "Saving..." : "Save Access"}</Button>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}
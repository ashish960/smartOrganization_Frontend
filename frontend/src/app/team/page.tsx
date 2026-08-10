"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import Button from "@/components/ui/Button";

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

interface AddMemberForm {
  name: string;
  email: string;
  role: string;
  jobTitle: string;
  departmentId: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getRoleStyle = (role: string) => {
  const map: Record<string, { className: string; label: string }> = {
    ORG_ADMIN:    { className: "bg-secondary/10 text-secondary border border-secondary/20", label: "Org Admin"    },
    DEPT_MANAGER: { className: "bg-primary/10 text-primary border border-primary/20", label: "Dept Manager" },
    USER:         { className: "bg-success/10 text-success border border-success/20",  label: "User"         },
    VIEWER:       { className: "bg-text-muted/10 text-text-muted border border-border", label: "Viewer"       },
    SUPER_ADMIN:  { className: "bg-error/10 text-error border border-error/20",   label: "Super Admin"  },
  };
  return map[role] ?? { className: "bg-text-muted/10 text-text-muted border border-border", label: role };
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border p-7 w-full max-w-[480px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
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

const inputClass = "w-full px-3.5 py-2.5 rounded-xl bg-surface-hover border border-border text-text-primary text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all";

export default function TeamPage() {
  const { token, user } = useSelector((state: AppRootState) => state.auth);

  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [deptFilter, setDeptFilter]   = useState("all");
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [refresh, setRefresh]         = useState(0);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [removingId, setRemovingId]   = useState<string | null>(null);
  const [isSaving, setIsSaving]       = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<AddMemberForm>({
    name: "", email: "", role: "USER", jobTitle: "", departmentId: "",
  });

  const isAdmin = (user as { role?: string } | null)?.role === "ORG_ADMIN";

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); };
  const showError   = (msg: string) => { setError(msg);   setTimeout(() => setError(null),   4000); };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const [membRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/organization/members`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/departments`,          { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [membData, deptData] = await Promise.all([membRes.json(), deptRes.json()]);
        if (!cancelled) {
          if (membData.success) setMembers(membData.data);
          if (deptData.success) setDepartments(deptData.data);
        }
      } catch { if (!cancelled) showError("Failed to load team"); }
      finally  { if (!cancelled) setIsLoading(false); }
    };
    if (token) load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  const handleAddMember = async () => {
    if (!addForm.name || !addForm.email) return showError("Name and email are required");
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/add-member`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setTempPassword(data.data.tempPassword);
        setRefresh(p => p + 1);
        setAddForm({ name: "", email: "", role: "USER", jobTitle: "", departmentId: "" });
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) { showError(err instanceof Error ? err.message : "Failed to add member"); }
    finally { setIsSaving(false); }
  };

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

  const filtered = members.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !m.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (deptFilter !== "all") {
      if (deptFilter === "none" && m.department !== null) return false;
      if (deptFilter !== "none" && m.department?._id !== deptFilter) return false;
    }
    return true;
  });

  return (
    <DashboardLayout title="Team" subtitle="Manage your organization's members">

      {success && <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium backdrop-blur-md shadow-lg">✅ {success}</div>}
      {error   && <div className="fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium backdrop-blur-md shadow-lg">❌ {error} <button onClick={() => setError(null)} className="ml-3 bg-transparent border-none cursor-pointer text-error hover:text-error/80">✕</button></div>}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] max-w-[340px] px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm" />
        {isAdmin && (
          <Button onClick={() => setShowAddMember(true)} variant="primary" size="sm">
            + Add Member
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-sm">
        <span className="text-xs text-text-muted font-bold tracking-wider">FILTER BY</span>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm cursor-pointer outline-none hover:bg-surface-hover transition-colors">
          <option value="all">All Roles</option>
          <option value="ORG_ADMIN">Org Admin</option>
          <option value="DEPT_MANAGER">Dept Manager</option>
          <option value="USER">User</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm cursor-pointer outline-none hover:bg-surface-hover transition-colors">
          <option value="all">All Departments</option>
          <option value="none">No Department</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
        </select>
        {(roleFilter !== "all" || deptFilter !== "all") && (
          <button onClick={() => { setRoleFilter("all"); setDeptFilter("all"); }} className="px-3 py-1.5 rounded-lg text-xs bg-error/10 border border-error/20 text-error cursor-pointer font-semibold hover:bg-error/20 transition-colors">Clear</button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-7">
        {[
          { label: "Total Members", value: members.length,                                        color: "text-primary", bg: "bg-primary/5" },
          { label: "Admins",        value: members.filter(m => m.role === "ORG_ADMIN").length,    color: "text-secondary", bg: "bg-secondary/5" },
          { label: "Managers",      value: members.filter(m => m.role === "DEPT_MANAGER").length, color: "text-warning", bg: "bg-warning/5" },
          { label: "Showing",       value: filtered.length,                                       color: "text-success", bg: "bg-success/5" },
        ].map((s) => (
          <div key={s.label} className={`px-5 py-3 rounded-xl ${s.bg} border border-border flex items-center gap-3 backdrop-blur-sm shadow-sm`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-sm font-medium text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16 opacity-50">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-4 opacity-50">
          <span className="text-5xl">👥</span>
          <p className="text-lg font-semibold text-text-primary">No members found</p>
          <p className="text-sm text-text-muted">Try adjusting your filters or add a new member</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((member) => {
            const roleStyle     = getRoleStyle(member.role);
            const isCurrentUser = (user as { id?: string } | null)?.id === member._id;
            return (
              <div key={member._id} className={`p-5 rounded-2xl bg-surface/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 relative border ${isCurrentUser ? "border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "border-border"}`}>
                {isCurrentUser && <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold tracking-wider">YOU</span>}

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-sm">
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate pr-8">{member.name}</p>
                    <p className="text-xs text-text-muted truncate">{member.email}</p>
                  </div>
                </div>

                <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold self-start ${roleStyle.className}`}>{roleStyle.label}</span>

                {member.jobTitle && <p className="text-xs text-text-muted font-medium">💼 {member.jobTitle}</p>}

                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-hover border border-border">
                  <span className="text-sm">{member.department?.icon ?? "🏢"}</span>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{member.department?.name ?? "No Department"}</p>
                    {member.department && <p className="text-[10px] text-text-muted">{member.department.code}</p>}
                  </div>
                </div>

                <p className="text-[11px] text-text-muted">Last login: {formatDate(member.lastLogin)}</p>

                <div className="flex gap-2 mt-auto pt-2">
                  <Button variant="secondary" size="sm" onClick={() => { setSelectedMember(member); setShowProfile(true); }} className="flex-1">View Profile</Button>
                  {isAdmin && !isCurrentUser && (
                    <Button variant="danger" size="sm" onClick={() => handleRemove(member._id)} disabled={removingId === member._id}>
                      {removingId === member._id ? "..." : "Remove"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddMember && (
        <Modal onClose={() => { setShowAddMember(false); setTempPassword(null); setAddForm({ name: "", email: "", role: "USER", jobTitle: "", departmentId: "" }); }}>
          <h2 className="text-xl font-bold text-text-primary mb-1">Add Team Member</h2>
          <p className="text-sm text-text-muted mb-6">Create a new account under your organization</p>

          {tempPassword ? (
            <div>
              <div className="p-5 rounded-xl bg-success/10 border border-success/20 mb-6">
                <p className="text-sm font-bold text-success mb-2">✅ Member added successfully!</p>
                <p className="text-sm text-text-muted mb-4">Share these credentials with the new member:</p>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <p className="text-xs text-text-muted mb-1">Temporary Password</p>
                  <p className="text-lg font-bold font-mono text-warning tracking-widest">{tempPassword}</p>
                </div>
                <p className="text-[11px] text-text-muted mt-3">⚠️ Make sure to copy this — it won't be shown again.</p>
              </div>
              <Button onClick={() => { setShowAddMember(false); setTempPassword(null); }} className="w-full">Done</Button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="col-span-2">
                  <Field label="Full Name *">
                    <input value={addForm.name} onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="John Doe" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Email *">
                    <input value={addForm.email} onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="john@example.com" type="email" />
                  </Field>
                </div>
                <Field label="Role">
                  <select value={addForm.role} onChange={(e) => setAddForm(p => ({ ...p, role: e.target.value }))} className={inputClass}>
                    <option value="USER">User</option>
                    <option value="DEPT_MANAGER">Dept Manager</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="ORG_ADMIN">Org Admin</option>
                  </select>
                </Field>
                <Field label="Department">
                  <select value={addForm.departmentId} onChange={(e) => setAddForm(p => ({ ...p, departmentId: e.target.value }))} className={inputClass}>
                    <option value="">No Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.icon} {d.name}</option>)}
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Job Title">
                    <input value={addForm.jobTitle} onChange={(e) => setAddForm(p => ({ ...p, jobTitle: e.target.value }))} className={inputClass} placeholder="e.g. Software Engineer" />
                  </Field>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20 mb-6">
                <p className="text-xs text-warning font-medium">⚠️ A temporary password will be generated. Share it with the new member so they can log in.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowAddMember(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleAddMember} disabled={isSaving} className="flex-1">{isSaving ? "Adding..." : "Add Member"}</Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showProfile && selectedMember && (
        <Modal onClose={() => { setShowProfile(false); setSelectedMember(null); }}>
          <div className="flex flex-col items-center gap-3 mb-7">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white shadow-md">
              {getInitials(selectedMember.name)}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">{selectedMember.name}</h2>
              <p className="text-sm text-text-muted mt-0.5">{selectedMember.email}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${getRoleStyle(selectedMember.role).className}`}>
              {getRoleStyle(selectedMember.role).label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Job Title",      value: selectedMember.jobTitle ?? "Not set"                },
              { label: "Department",     value: selectedMember.department?.name ?? "None"           },
              { label: "Email Verified", value: selectedMember.isEmailVerified ? "✅ Yes" : "❌ No" },
              { label: "Member Since",   value: formatDate(selectedMember.createdAt)                },
              { label: "Last Login",     value: formatDate(selectedMember.lastLogin)                },
              { label: "Dept Code",      value: selectedMember.department?.code ?? "—"             },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-surface-hover border border-border">
                <p className="text-[11px] text-text-muted mb-1 uppercase tracking-wider font-semibold">{item.label}</p>
                <p className="text-sm font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setShowProfile(false); setSelectedMember(null); }} className="flex-1">Close</Button>
            {isAdmin && (user as { id?: string } | null)?.id !== selectedMember._id && (
              <Button variant="danger" onClick={() => handleRemove(selectedMember._id)} disabled={removingId === selectedMember._id} className="flex-1">
                {removingId === selectedMember._id ? "Removing..." : "Remove Member"}
              </Button>
            )}
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}
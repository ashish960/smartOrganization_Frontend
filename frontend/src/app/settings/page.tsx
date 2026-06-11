"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector, useDispatch } from "react-redux";
import { AppRootState } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  role: string;
  organization: {
    _id: string;
    name: string;
    industry: string;
    size: string;
    plan: string;
  } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const INDUSTRIES = [
  "TECHNOLOGY", "HEALTHCARE", "LEGAL", "FINANCE",
  "EDUCATION", "RETAIL", "MANUFACTURING", "OTHER"
];

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
  color: "var(--color-text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
};

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>{title}</h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { token, user: authUser } = useSelector((state: AppRootState) => state.auth);
  const dispatch = useDispatch();

  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", jobTitle: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Org form
  const [orgForm, setOrgForm] = useState({ name: "", industry: "", size: "" });
  const [orgSaving, setOrgSaving] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    emailOnUpload:   true,
    emailOnMember:   true,
    emailOnAI:       false,
    weeklyDigest:    true,
    securityAlerts:  true,
  });

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = (authUser as { role?: string } | null)?.role === "ORG_ADMIN";

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!cancelled && data.success) {
          setProfile(data.data);
          setProfileForm({ name: data.data.name || "", jobTitle: data.data.jobTitle || "", phone: data.data.phone || "" });
          if (data.data.organization) {
            setOrgForm({ name: data.data.organization.name || "", industry: data.data.organization.industry || "", size: data.data.organization.size || "" });
          }
        }
      } catch { if (!cancelled) showToast("Failed to load profile", "error"); }
      finally  { if (!cancelled) setIsLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  // ── Update profile ───────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) return showToast("Name is required", "error");
    setProfileSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...profileForm } : null);
        // Update Redux store
        dispatch(loginSuccess({ user: { ...authUser, ...profileForm }, token }));
        localStorage.setItem("user", JSON.stringify({ ...authUser, ...profileForm }));
        showToast("Profile updated successfully!", "success");
      } else throw new Error(data.message);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to update", "error"); }
    finally { setProfileSaving(false); }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword) return showToast("Current password is required", "error");
    if (passwordForm.newPassword.length < 8) return showToast("New password must be at least 8 characters", "error");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showToast("Passwords don't match", "error");
    setPasswordSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        showToast("Password changed successfully!", "success");
      } else throw new Error(data.message);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to change password", "error"); }
    finally { setPasswordSaving(false); }
  };

  // ── Update organization ──────────────────────────────────────────────────
  const handleOrgSave = async () => {
    if (!orgForm.name.trim()) return showToast("Organization name is required", "error");
    setOrgSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/organization/update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      const data = await res.json();
      if (data.success) { showToast("Organization updated successfully!", "success"); }
      else throw new Error(data.message);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to update", "error"); }
    finally { setOrgSaving(false); }
  };

  const tabs = [
    { id: "profile",       label: "👤 Profile"      },
    { id: "password",      label: "🔒 Password"     },
    { id: "organization",  label: "🏢 Organization" },
    { id: "notifications", label: "🔔 Notifications" },
  ];

  if (isLoading) return (
    <DashboardLayout title="Settings" subtitle="Manage your account and organization">
      <div style={{ display: "flex", justifyContent: "center", padding: "80px", opacity: 0.5 }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #3b82f6", animation: "spin 0.8s linear infinite" }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and organization">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "24px", zIndex: 999,
          padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
          background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.type === "success" ? "#10b981" : "#ef4444",
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px" }}>

        {/* ── Sidebar tabs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 14px", borderRadius: "8px", textAlign: "left", fontSize: "14px",
              border: "none", cursor: "pointer", fontWeight: activeTab === tab.id ? "600" : "400",
              background: activeTab === tab.id ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))" : "transparent",
              color: activeTab === tab.id ? "var(--color-text)" : "var(--color-text-muted)",
              borderLeft: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
            }}>
              {tab.label}
            </button>
          ))}

          {/* User card */}
          {profile && (
            <div style={{ marginTop: "20px", padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", color: "#fff", margin: "0 auto 10px" }}>
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", textAlign: "center" }}>{profile.name}</p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>{profile.email}</p>
              <p style={{ fontSize: "10px", color: "#a855f7", textAlign: "center", marginTop: "4px", fontWeight: "600" }}>{profile.role.replace("_", " ")}</p>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div>

          {/* Profile */}
          {activeTab === "profile" && (
            <Section title="Profile Information" subtitle="Update your personal details">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <Field label="Full Name *">
                  <input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="John Doe" />
                </Field>
                <Field label="Email">
                  <input value={profile?.email || ""} style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} disabled />
                </Field>
                <Field label="Job Title">
                  <input value={profileForm.jobTitle} onChange={(e) => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))} style={inputStyle} placeholder="e.g. Software Engineer" />
                </Field>
                <Field label="Phone">
                  <input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+91 98765 43210" />
                </Field>
              </div>
              <button onClick={handleProfileSave} disabled={profileSaving} className="gradient-button" style={{ marginTop: "8px" }}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </Section>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <Section title="Change Password" subtitle="Update your account password">
              <Field label="Current Password">
                <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} style={inputStyle} placeholder="••••••••" />
              </Field>
              <Field label="New Password">
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} style={inputStyle} placeholder="••••••••" />
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>Minimum 8 characters</p>
              </Field>
              <Field label="Confirm New Password">
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} style={inputStyle} placeholder="••••••••" />
              </Field>
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>❌ Passwords don&apos;t match</p>
              )}
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p style={{ fontSize: "12px", color: "#10b981", marginBottom: "12px" }}>✅ Passwords match</p>
              )}
              <button onClick={handlePasswordSave} disabled={passwordSaving} className="gradient-button">
                {passwordSaving ? "Changing..." : "Change Password"}
              </button>
            </Section>
          )}

          {/* Organization */}
          {activeTab === "organization" && (
            isAdmin ? (
              <Section title="Organization Settings" subtitle="Update your organization details">
                <Field label="Organization Name *">
                  <input value={orgForm.name} onChange={(e) => setOrgForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Acme Corp" />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Industry">
                    <select value={orgForm.industry} onChange={(e) => setOrgForm(p => ({ ...p, industry: e.target.value }))} style={inputStyle}>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Company Size">
                    <select value={orgForm.size} onChange={(e) => setOrgForm(p => ({ ...p, size: e.target.value }))} style={inputStyle}>
                      {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </Field>
                </div>

                {/* Plan info */}
                <div style={{ padding: "14px 16px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(59,130,246,0.2)", marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Current Plan: <span style={{ color: "#3b82f6" }}>{profile?.organization?.plan || "STARTER"}</span>
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Contact support to upgrade your plan</p>
                </div>

                <button onClick={handleOrgSave} disabled={orgSaving} className="gradient-button">
                  {orgSaving ? "Saving..." : "Save Organization"}
                </button>
              </Section>
            ) : (
              <Section title="Organization Settings" subtitle="Organization details">
                <div style={{ padding: "20px", borderRadius: "10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "#f59e0b" }}>⚠️ Only Org Admins can update organization settings</p>
                </div>
              </Section>
            )
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <Section title="Notification Preferences" subtitle="Choose what you want to be notified about">
              {[
                { key: "emailOnUpload",  label: "Document Uploads",    sub: "Get notified when documents are uploaded"  },
                { key: "emailOnMember",  label: "New Team Members",    sub: "Get notified when someone joins your org"  },
                { key: "emailOnAI",      label: "AI Query Alerts",     sub: "Get notified on high AI usage"             },
                { key: "weeklyDigest",   label: "Weekly Digest",       sub: "Receive a weekly summary of activity"      },
                { key: "securityAlerts", label: "Security Alerts",     sub: "Get notified of suspicious login attempts" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "600" }}>{item.label}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.sub}</p>
                  </div>
                  <div
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer",
                      background: notifications[item.key as keyof typeof notifications] ? "linear-gradient(135deg, #3b82f6, #a855f7)" : "rgba(255,255,255,0.1)",
                      position: "relative", transition: "all 0.2s ease", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                      position: "absolute", top: "3px", transition: "left 0.2s ease",
                      left: notifications[item.key as keyof typeof notifications] ? "23px" : "3px",
                    }}/>
                  </div>
                </div>
              ))}
              <button className="gradient-button" style={{ marginTop: "20px" }} onClick={() => showToast("Notification preferences saved!", "success")}>
                Save Preferences
              </button>
            </Section>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
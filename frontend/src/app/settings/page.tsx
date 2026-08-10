"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSelector, useDispatch } from "react-redux";
import { AppRootState } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";

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

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-surface border border-border mb-5">
      <div className="mb-5">
        <h3 className="text-[15px] font-bold mb-1 text-text-primary">{title}</h3>
        <p className="text-[13px] text-text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="dark-label">
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

  const [profileForm, setProfileForm] = useState({ name: "", jobTitle: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [orgForm, setOrgForm] = useState({ name: "", industry: "", size: "" });
  const [orgSaving, setOrgSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    emailOnUpload:   true,
    emailOnMember:   true,
    emailOnAI:       false,
    weeklyDigest:    true,
    securityAlerts:  true,
  });

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = (authUser as { role?: string } | null)?.role === "ORG_ADMIN";

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
        dispatch(loginSuccess({ user: { ...authUser, ...profileForm }, token }));
        localStorage.setItem("user", JSON.stringify({ ...authUser, ...profileForm }));
        showToast("Profile updated successfully!", "success");
      } else throw new Error(data.message);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to update", "error"); }
    finally { setProfileSaving(false); }
  };

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
      <div className="flex justify-center py-20 opacity-50">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and organization">

      {toast && (
        <div className={`fixed top-20 right-6 z-[999] px-5 py-3 rounded-xl text-sm font-medium
          ${toast.type === "success"
            ? "bg-success/15 border border-success/30 text-success"
            : "bg-error/15 border border-error/30 text-error"
          }`}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-[220px_1fr] gap-6">

        <div className="flex flex-col gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-lg text-left text-sm border-l-2 transition-all cursor-pointer
                ${activeTab === tab.id
                  ? "font-semibold bg-gradient-to-br from-primary/15 to-secondary/15 text-text-primary border-l-primary"
                  : "font-normal bg-transparent text-text-muted border-l-transparent hover:bg-surface-hover hover:text-text-secondary"
                }`}
            >
              {tab.label}
            </button>
          ))}

          {profile && (
            <div className="mt-5 p-3.5 rounded-xl bg-surface border border-border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-base font-bold text-white mx-auto mb-2.5">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <p className="text-[13px] font-semibold text-center text-text-primary">{profile.name}</p>
              <p className="text-[11px] text-text-muted text-center">{profile.email}</p>
              <p className="text-[10px] text-secondary text-center mt-1 font-semibold">{profile.role.replace("_", " ")}</p>
            </div>
          )}
        </div>

        <div>

          {activeTab === "profile" && (
            <Section title="Profile Information" subtitle="Update your personal details">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input value={profileForm.name} onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))} className="dark-input" placeholder="John Doe" />
                </Field>
                <Field label="Email">
                  <input value={profile?.email || ""} className="dark-input opacity-50 cursor-not-allowed" disabled />
                </Field>
                <Field label="Job Title">
                  <input value={profileForm.jobTitle} onChange={(e) => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))} className="dark-input" placeholder="e.g. Software Engineer" />
                </Field>
                <Field label="Phone">
                  <input value={profileForm.phone} onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="dark-input" placeholder="+91 98765 43210" />
                </Field>
              </div>
              <button onClick={handleProfileSave} disabled={profileSaving} className="gradient-button mt-2">
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </Section>
          )}

          {activeTab === "password" && (
            <Section title="Change Password" subtitle="Update your account password">
              <Field label="Current Password">
                <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="dark-input" placeholder="••••••••" />
              </Field>
              <Field label="New Password">
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="dark-input" placeholder="••••••••" />
                <p className="text-[11px] text-text-muted mt-1">Minimum 8 characters</p>
              </Field>
              <Field label="Confirm New Password">
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="dark-input" placeholder="••••••••" />
              </Field>
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-error mb-3">❌ Passwords don&apos;t match</p>
              )}
              {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p className="text-xs text-success mb-3">✅ Passwords match</p>
              )}
              <button onClick={handlePasswordSave} disabled={passwordSaving} className="gradient-button">
                {passwordSaving ? "Changing..." : "Change Password"}
              </button>
            </Section>
          )}

          {activeTab === "organization" && (
            isAdmin ? (
              <Section title="Organization Settings" subtitle="Update your organization details">
                <Field label="Organization Name *">
                  <input value={orgForm.name} onChange={(e) => setOrgForm(p => ({ ...p, name: e.target.value }))} className="dark-input" placeholder="Acme Corp" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Industry">
                    <select value={orgForm.industry} onChange={(e) => setOrgForm(p => ({ ...p, industry: e.target.value }))} className="dark-input">
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Company Size">
                    <select value={orgForm.size} onChange={(e) => setOrgForm(p => ({ ...p, size: e.target.value }))} className="dark-input">
                      {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </Field>
                </div>

                <div className="px-4 py-3.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 mb-4">
                  <p className="text-[13px] font-semibold mb-1 text-text-primary">
                    Current Plan: <span className="text-primary">{profile?.organization?.plan || "STARTER"}</span>
                  </p>
                  <p className="text-xs text-text-muted">Contact support to upgrade your plan</p>
                </div>

                <button onClick={handleOrgSave} disabled={orgSaving} className="gradient-button">
                  {orgSaving ? "Saving..." : "Save Organization"}
                </button>
              </Section>
            ) : (
              <Section title="Organization Settings" subtitle="Organization details">
                <div className="p-5 rounded-xl bg-warning/10 border border-warning/20 text-center">
                  <p className="text-sm text-warning">⚠️ Only Org Admins can update organization settings</p>
                </div>
              </Section>
            )
          )}

          {activeTab === "notifications" && (
            <Section title="Notification Preferences" subtitle="Choose what you want to be notified about">
              {[
                { key: "emailOnUpload",  label: "Document Uploads",    sub: "Get notified when documents are uploaded"  },
                { key: "emailOnMember",  label: "New Team Members",    sub: "Get notified when someone joins your org"  },
                { key: "emailOnAI",      label: "AI Query Alerts",     sub: "Get notified on high AI usage"             },
                { key: "weeklyDigest",   label: "Weekly Digest",       sub: "Receive a weekly summary of activity"      },
                { key: "securityAlerts", label: "Security Alerts",     sub: "Get notified of suspicious login attempts" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-border">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-muted">{item.sub}</p>
                  </div>
                  <div
                    onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                    className={`w-11 h-6 rounded-full cursor-pointer relative transition-all duration-200 shrink-0
                      ${notifications[item.key as keyof typeof notifications]
                        ? "bg-gradient-to-br from-primary to-secondary"
                        : "bg-border"
                      }`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all duration-200
                      ${notifications[item.key as keyof typeof notifications] ? "left-[23px]" : "left-[3px]"}`}
                    />
                  </div>
                </div>
              ))}
              <button className="gradient-button mt-5" onClick={() => showToast("Notification preferences saved!", "success")}>
                Save Preferences
              </button>
            </Section>
          )}

        </div>
      </div>

    </DashboardLayout>
  );
}
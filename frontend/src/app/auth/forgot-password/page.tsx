"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>("email");
  const [email, setEmail]           = useState("");
  const [otp, setOtp]               = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)",
    color: "var(--color-text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
    marginTop: "6px",
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Email is required");
    setIsLoading(true); setError("");

    try {
      const res  = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`OTP sent to ${email}`);
        setStep("otp");
      } else throw new Error(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally { setIsLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setError("Enter the 6-digit OTP");
    setIsLoading(true); setError("");

    try {
      const res  = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.data.resetToken);
        setSuccess("OTP verified! Set your new password");
        setStep("password");
      } else throw new Error(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return setError("Password must be at least 8 characters");
    if (newPassword !== confirmPassword) return setError("Passwords don't match");
    setIsLoading(true); setError("");

    try {
      const res  = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else throw new Error(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally { setIsLoading(false); }
  };

  const steps = ["email", "otp", "password"];
  const stepIndex = steps.indexOf(step);

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We'll send an OTP to your email"
      footerLink={{ text: "Remember your password?", linkText: "Sign In", href: "/auth/login" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
        {["Email", "Verify OTP", "New Password"].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: "700",
                background: i <= stepIndex
                  ? "linear-gradient(135deg, #3b82f6, #a855f7)"
                  : "rgba(255,255,255,0.1)",
                color: i <= stepIndex ? "#fff" : "rgba(255,255,255,0.4)",
              }}>
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "10px", color: i <= stepIndex ? "var(--color-text)" : "var(--color-text-muted)", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: "40px", height: "2px", borderRadius: "2px", background: i < stepIndex ? "linear-gradient(135deg, #3b82f6, #a855f7)" : "rgba(255,255,255,0.1)", marginBottom: "16px" }}/>}
          </div>
        ))}
      </div>

      {success && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", fontSize: "13px", marginBottom: "16px" }}>
          ✅ {success}
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
          ❌ {error}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="dark-label">Email Address</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="john@example.com" style={inputStyle} autoFocus />
          </div>
          <button type="submit" disabled={isLoading} className="gradient-button mt-2">
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="dark-label">Enter OTP</label>
            <input
              type="text" value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000" maxLength={6} autoFocus
              style={{ ...inputStyle, textAlign: "center", fontSize: "24px", fontWeight: "700", letterSpacing: "8px" }}
            />
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>
              OTP sent to <strong>{email}</strong> · Valid for 10 minutes
            </p>
          </div>
          <button type="submit" disabled={isLoading || otp.length !== 6} className="gradient-button mt-2">
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
          <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); setSuccess(""); }}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "14px", marginTop: "8px" }}>
            ← Change Email
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="dark-label">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="••••••••" style={inputStyle} autoFocus />
          </div>
          <div>
            <label className="dark-label">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="••••••••" style={inputStyle} />
          </div>
          <button type="submit" disabled={isLoading} className="gradient-button mt-2">
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
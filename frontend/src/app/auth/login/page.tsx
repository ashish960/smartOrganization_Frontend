"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (err) {
      console.log("Login failed:", err);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="AI-Powered Document Intelligence"
      footerLink={{
        text: "Don't have an account?",
        linkText: "Sign Up",
        href: "/auth/register",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* API Error */}
        {error && (
          <div
            className="p-3 rounded-lg text-sm text-center"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="dark-label">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="dark-input"
          />
          {errors.email && (
            <p className="dark-error">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="dark-label" style={{ marginBottom: 0 }}>
              Password
            </label>
            <a
              href="/auth/forgot-password"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Forgot password?
            </a>
          </div>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="dark-input"
          />
          {errors.password && (
            <p className="dark-error">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="gradient-button mt-2"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
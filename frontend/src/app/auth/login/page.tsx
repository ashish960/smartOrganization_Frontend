"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToastContext } from "@/context/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { toast } = useToastContext();

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
      toast.success("Welcome back! Logged in successfully");
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed";
      toast.error(errorMessage);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="AI-Powered Document Intelligence"
      footerLink={{
        text: "Create your own organization : ",
        linkText: "Register Organization",
        href: "/auth/register",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="dark-label">Email Address</label>
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
            <label className="dark-label !mb-0">
              Password
            </label>
            <a
              href="/auth/forgot-password"
              className="text-xs font-medium transition-colors text-primary hover:text-primary-hover"
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

        {/* Submit */}
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
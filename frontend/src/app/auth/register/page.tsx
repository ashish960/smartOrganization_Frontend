"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await register(formData.name, formData.email, formData.password);
      router.push("/dashboard");
    } catch (err) {
      console.log("Registration failed:", err);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="AI-Powered Document Intelligence"
      footerLink={{
        text: "Already have an account?",
        linkText: "Sign In",
        href: "/auth/login",
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

        {/* Name */}
        <div>
          <label className="dark-label">Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            className="dark-input"
          />
          {errors.name && (
            <p className="dark-error">{errors.name}</p>
          )}
        </div>

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
          <label className="dark-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            className="dark-input"
          />
          {errors.password && (
            <p className="dark-error">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="dark-label">Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="dark-input"
          />
          {errors.confirmPassword && (
            <p className="dark-error">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="gradient-button mt-2"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
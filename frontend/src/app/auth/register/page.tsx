"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToastContext } from "@/context/ToastContext";

type Step = 1 | 2;

interface PersonalData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface OrgData {
  orgName: string;
  industry: string;
  size: string;
}

interface PersonalErrors {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface OrgErrors {
  orgName: string;
  industry: string;
  size: string;
}

const INDUSTRIES = [
  { value: "", label: "Select Industry" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "LEGAL", label: "Legal" },
  { value: "FINANCE", label: "Finance" },
  { value: "EDUCATION", label: "Education" },
  { value: "RETAIL", label: "Retail" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "OTHER", label: "Other" },
];

const SIZES = [
  { value: "", label: "Select Company Size" },
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { toast } = useToastContext();

  const [step, setStep] = useState<Step>(1);

  const [personal, setPersonal] = useState<PersonalData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [personalErrors, setPersonalErrors] = useState<PersonalErrors>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [org, setOrg] = useState<OrgData>({
    orgName: "",
    industry: "",
    size: "",
  });
  const [orgErrors, setOrgErrors] = useState<OrgErrors>({
    orgName: "",
    industry: "",
    size: "",
  });

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonal((prev) => ({ ...prev, [name]: value }));
    if (personalErrors[name as keyof PersonalErrors]) {
      setPersonalErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleOrgChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOrg((prev) => ({ ...prev, [name]: value }));
    if (orgErrors[name as keyof OrgErrors]) {
      setOrgErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = (): boolean => {
    const errors: PersonalErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let valid = true;

    if (!personal.name) {
      errors.name = "Name is required";
      valid = false;
    } else if (personal.name.length < 2) {
      errors.name = "Min 2 characters";
      valid = false;
    }

    if (!personal.email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
      errors.email = "Invalid email";
      valid = false;
    }

    if (!personal.password) {
      errors.password = "Password is required";
      valid = false;
    } else if (personal.password.length < 8) {
      errors.password = "Min 8 characters";
      valid = false;
    }

    if (!personal.confirmPassword) {
      errors.confirmPassword = "Required";
      valid = false;
    } else if (personal.password !== personal.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
      valid = false;
    }

    setPersonalErrors(errors);
    return valid;
  };

  const validateStep2 = (): boolean => {
    const errors: OrgErrors = { orgName: "", industry: "", size: "" };
    let valid = true;

    if (!org.orgName.trim()) {
      errors.orgName = "Organization name is required";
      valid = false;
    } else if (org.orgName.trim().length < 2) {
      errors.orgName = "Min 2 characters";
      valid = false;
    }

    if (!org.industry) {
      errors.industry = "Please select an industry";
      valid = false;
    }

    if (!org.size) {
      errors.size = "Please select company size";
      valid = false;
    }

    setOrgErrors(errors);
    return valid;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    try {
      await register(
        personal.name,
        personal.email,
        personal.password,
        org.orgName,
        org.industry,
        org.size
      );
      toast.success("Organization registered successfully 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(errorMessage);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? "Create Account" : "Setup Organization"}
      subtitle={
        step === 1
          ? "AI-Powered Document Intelligence"
          : "Tell us about your company"
      }
      footerLink={{
        text: "Already have an account?",
        linkText: "Sign In",
        href: "/auth/login",
      }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-300 ${
              step >= 1
                ? "bg-gradient-to-br from-primary to-secondary"
                : "bg-surface-hover"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </div>

          <div
            className={`h-0.5 w-20 rounded-sm transition-all duration-300 ${
              step > 1
                ? "bg-gradient-to-r from-primary to-secondary"
                : "bg-surface-hover"
            }`}
          />

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              step === 2
                ? "bg-gradient-to-br from-primary to-secondary text-white"
                : "bg-surface-hover text-text-muted"
            }`}
          >
            2
          </div>
        </div>

        <p className="text-center text-xs text-text-muted">
          Step {step} of 2 —{" "}
          {step === 1 ? "Personal Information" : "Organization Details"}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleNextStep} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dark-label">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={personal.name}
                onChange={handlePersonalChange}
                autoComplete="name"
                className="dark-input"
              />
              {personalErrors.name && (
                <p className="dark-error">{personalErrors.name}</p>
              )}
            </div>

            <div>
              <label className="dark-label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={personal.email}
                onChange={handlePersonalChange}
                autoComplete="email"
                className="dark-input"
              />
              {personalErrors.email && (
                <p className="dark-error">{personalErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dark-label">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={personal.password}
                onChange={handlePersonalChange}
                autoComplete="new-password"
                className="dark-input"
              />
              {personalErrors.password && (
                <p className="dark-error">{personalErrors.password}</p>
              )}
            </div>

            <div>
              <label className="dark-label">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={personal.confirmPassword}
                onChange={handlePersonalChange}
                autoComplete="new-password"
                className="dark-input"
              />
              {personalErrors.confirmPassword && (
                <p className="dark-error">{personalErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="gradient-button mt-2">
            Continue →
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="dark-label">Organization Name</label>
            <input
              name="orgName"
              type="text"
              placeholder="Acme Corp"
              value={org.orgName}
              onChange={handleOrgChange}
              autoComplete="organization"
              className="dark-input"
            />
            {orgErrors.orgName && (
              <p className="dark-error">{orgErrors.orgName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="dark-label">Industry</label>
              <select
                name="industry"
                value={org.industry}
                onChange={handleOrgChange}
                className="dark-input cursor-pointer"
              >
                {INDUSTRIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {orgErrors.industry && (
                <p className="dark-error">{orgErrors.industry}</p>
              )}
            </div>

            <div>
              <label className="dark-label">Company Size</label>
              <select
                name="size"
                value={org.size}
                onChange={handleOrgChange}
                className="dark-input cursor-pointer"
              >
                {SIZES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {orgErrors.size && (
                <p className="dark-error">{orgErrors.size}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-none px-5 py-2.5 rounded-lg border border-border bg-surface text-text-secondary text-sm cursor-pointer transition-all duration-200 hover:bg-surface-hover hover:border-border-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="gradient-button flex-1"
            >
              {isLoading ? "Creating Account..." : "Create Account 🚀"}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
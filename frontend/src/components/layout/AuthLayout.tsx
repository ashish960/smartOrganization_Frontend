import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

const AuthLayout = ({ children, title, subtitle, footerLink }: AuthLayoutProps) => {
  return (
    <div className="auth-background flex items-center justify-center p-4">
      {/* Glowing orbs */}
      <div className="orb-blue" />
      <div className="orb-purple" />
      <div className="orb-cyan" />

      {/* Grid pattern */}
      <div className="grid-pattern" />

      {/* Main Container */}
      <div className="relative w-full max-w-lg z-10">

        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="logo-icon mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>

          <h1 className="gradient-text text-4xl font-bold mb-2">
            SmartOrg AI
          </h1>

          {subtitle && (
            <p
              className="text-sm font-medium tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Glass Card */}
        <div className="glass-card">

          {/* Title */}
          <div className="text-center mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              {title}
            </h2>
            <div className="gradient-line" />
          </div>

          {/* Form Content */}
          <div className="mb-6">
            {children}
          </div>

          {/* Footer Link */}
          {footerLink && (
            <div
              className="text-center pt-6 mt-2"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                {footerLink.text}{" "}
                <a
                  href={footerLink.href}
                  className="font-semibold transition-colors"
                  style={{ color: "var(--color-primary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-primary-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-primary)")
                  }
                >
                  {footerLink.linkText}
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="text-center mt-6">
          <p
            className="text-xs opacity-60"
            style={{ color: "var(--color-text-muted)" }}
          >
            © 2024 SmartOrg AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
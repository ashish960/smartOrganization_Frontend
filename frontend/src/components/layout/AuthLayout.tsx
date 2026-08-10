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
    <div className="auth-background flex items-center justify-center p-4 min-h-screen relative overflow-hidden bg-background">
      <div className="orb-blue absolute w-[500px] h-[500px] -top-[100px] -left-[100px] rounded-full mix-blend-screen opacity-30 animate-blob bg-primary/30 blur-[60px]" />
      <div className="orb-purple absolute w-[600px] h-[600px] top-[50%] -right-[150px] rounded-full mix-blend-screen opacity-30 animate-blob animation-delay-2000 bg-secondary/30 blur-[60px]" />
      <div className="orb-cyan absolute w-[400px] h-[400px] -bottom-[100px] left-[30%] rounded-full mix-blend-screen opacity-20 animate-blob animation-delay-4000 bg-cyan-500/30 blur-[60px]" />

      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px]" />

      <div className="relative w-full max-w-lg z-10">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-glow flex items-center justify-center">
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

          <h1 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">
            SmartOrg AI
          </h1>

          {subtitle && (
            <p className="text-sm font-medium tracking-wide text-text-muted">
              {subtitle}
            </p>
          )}
        </div>

        <div className="bg-surface/60 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8">

          <div className="text-center mb-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              {title}
            </h2>
            <div className="h-1 w-16 mt-3 rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>

          <div className="mb-6">
            {children}
          </div>

          {footerLink && (
            <div className="text-center pt-6 mt-2 border-t border-border">
              <p className="text-sm text-text-muted">
                {footerLink.text}{" "}
                <a
                  href={footerLink.href}
                  className="font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {footerLink.linkText}
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-text-muted opacity-80">
            © {new Date().getFullYear()} SmartOrg AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
"use client";

import Link from "next/link";
import { Icons } from "@/constants/icons";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col transition-colors duration-300">
      
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
              ⚡
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
              SmartOrg AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">How it Works</a>
            <a href="#chat-demo" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">Interactive Demo</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
              Login
            </Link>
            <Link href="/auth/register" className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 shadow-md hover:shadow-lg transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative py-20 lg:py-28 overflow-hidden px-6">
        {/* Glow decorative effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-6">
              ✨ Next-Gen Document Intelligence
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1] mb-6">
              AI-Powered Knowledge for{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Smart Organizations
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              Analyze manuals, brief contracts, and query your company's documents securely in seconds. Enforce granular department visibility matrices automatically.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link href="/auth/register" className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all text-sm">
                Get Started Free
              </Link>
              <a href="#chat-demo" className="px-6 py-3 rounded-xl font-bold bg-surface border border-border text-text-primary hover:bg-surface-hover hover:border-border-hover transition-all text-sm">
                Live Preview
              </a>
            </div>
          </div>

          <div className="flex-1 w-full max-w-[560px] lg:max-w-none">
            {/* Glowing UI card mock */}
            <div className="p-1 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/30 shadow-2xl backdrop-blur-sm border border-white/5">
              <div className="bg-surface rounded-[22px] overflow-hidden border border-border/40 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary/25 border border-primary/50 text-[10px] flex items-center justify-center text-primary">✓</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Corporate Policy.pdf</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-success/15 border border-success/30 text-success font-bold uppercase">AI Ready</span>
                </div>
                
                <div className="p-4 rounded-xl bg-surface-hover border border-border text-xs leading-relaxed text-text-secondary">
                  <strong>AI Summary:</strong> This document outlines leave cycles, data security protocols, and cross-department collaboration rules. Section 4 specifies restricted documents require MANAGER approval.
                </div>

                <div className="flex items-center gap-2 text-xs border border-primary/25 bg-primary/5 rounded-xl p-3 text-primary font-semibold">
                  <span>💡</span>
                  <span>Ask AI anything about this document in real-time.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-20 bg-surface/30 border-t border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">
              Everything you need for Document Governance
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              Equip your organization with secure document sharing, AI search queries, and modular departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🧠",
                title: "Semantic AI Chat",
                desc: "Ask the AI assistant natural questions about contracts or policy briefs and get precise page-level citations.",
                color: "text-primary bg-primary/10 border-primary/20",
              },
              {
                icon: "🔒",
                title: "Granular Visibility",
                desc: "Choose whether documents are Public, Department-restricted, or entirely Private to the uploader.",
                color: "text-secondary bg-secondary/10 border-secondary/20",
              },
              {
                icon: "🔗",
                title: "Cross-Dept Access",
                desc: "Configure an Access Matrix permitting department members to securely read documents from other departments.",
                color: "text-success bg-success/10 border-success/20",
              },
              {
                icon: "🏢",
                title: "Template Departments",
                desc: "Initialize standard structural units (HR, Dev, Finance) using templates, or build customized departments.",
                color: "text-warning bg-warning/10 border-warning/20",
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-surface border border-border shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 border ${f.color}`}>
                  {f.icon}
                </span>
                <h3 className="text-base font-bold text-text-primary tracking-tight mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-4">
              How SmartOrg AI Works
            </h2>
            <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
              Launch your corporate intelligence suite in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: "01", title: "Create Organization", desc: "Register your company, select industry size, and set up your master workspace." },
              { step: "02", title: "Map Departments", desc: "Use template configurations or create custom departments with team managers." },
              { step: "03", title: "Upload Documents", desc: "Drop policy papers, research files, or spreadsheet data directly onto S3." },
              { step: "04", title: "Chat Dynamically", desc: "Ask the AI queries, examine visual stats dashboards, and share documents." },
            ].map((s, idx) => (
              <div key={s.step} className="flex flex-col relative z-10">
                <span className="text-4xl font-extrabold text-primary/20 mb-3">{s.step}</span>
                <h3 className="text-base font-bold text-text-primary mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-5 right-0 translate-x-1/2 w-8 h-px border-t border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo Section ── */}
      <section id="chat-demo" className="py-20 bg-surface/30 border-t border-b border-border px-6 transition-colors">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">Try the Chat Experience</h2>
            <p className="text-text-secondary text-xs sm:text-sm">Click one of the prompt ideas below to simulate an AI response citation.</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-lg flex flex-col min-h-[300px]">
            {/* Header */}
            <div className="px-4 py-3 bg-surface-hover border-b border-border flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">🤖</span>
              <div>
                <p className="text-xs font-bold text-text-primary">SmartOrg Assistant</p>
                <p className="text-[9px] text-success font-medium">✓ Online</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 flex-1 flex flex-col gap-4 text-xs sm:text-sm justify-end">
              <div className="flex gap-2.5 items-start">
                <span className="w-6 h-6 rounded-full bg-surface-hover border border-border flex items-center justify-center text-xs">🤖</span>
                <div className="p-3 bg-surface-hover rounded-r-xl rounded-bl-xl text-text-primary max-w-[85%] border border-border">
                  Hello! Select a query below to see how I fetch documents and cite sources.
                </div>
              </div>

              {/* simulated response state */}
              <div className="flex gap-2.5 items-start justify-end flex-row-reverse">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-[10px]">👤</span>
                <div className="p-3 bg-primary text-white rounded-l-xl rounded-br-xl max-w-[85%] font-medium">
                  What is our organization's data protection policy?
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-6 h-6 rounded-full bg-surface-hover border border-border flex items-center justify-center text-xs">🤖</span>
                <div className="p-3 bg-surface border border-border rounded-r-xl rounded-bl-xl text-text-primary max-w-[85%] flex flex-col gap-2">
                  <p>Our data security protocols mandate encryption for all S3 documents at rest. Additionally, cross-department sharing is prohibited unless explicitly configured in the access matrix.</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success font-bold">
                      Source 1 · p. 4 · 98% relevance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-border bg-surface transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                ⚡
              </div>
              <span className="font-bold text-text-primary">SmartOrg AI</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs">
              Futuristic, secure document governance and AI semantic analysis platform for growing business operations.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">Platform</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
              <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-text-primary transition-colors">Integrations</a>
              <Link href="/auth/register" className="hover:text-text-primary transition-colors">Pricing</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">Resources</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">Developer API</a>
              <a href="#" className="hover:text-text-primary transition-colors">User Guides</a>
              <a href="#" className="hover:text-text-primary transition-colors">Security Audit</a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4">Legal</h4>
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-text-primary transition-colors">GDPR Compliance</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>&copy; {new Date().getFullYear()} SmartOrg AI. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-text-secondary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-secondary transition-colors">GitHub</a>
            <a href="#" className="hover:text-text-secondary transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
"use client";

import Button from "@/components/ui/Button";

export default function TrialBanner() {
  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -ml-10 -mb-10 pointer-events-none" />
      
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-xl">🎉</span>
        <div>
          <p className="text-sm font-bold text-text-primary tracking-tight">Welcome to SmartOrg AI!</p>
          <p className="text-xs text-text-muted mt-0.5">
            You&apos;re on the <strong className="text-primary font-semibold">Starter plan</strong> — 14-day free trial active
          </p>
        </div>
      </div>
      
      <Button variant="primary" size="sm" className="relative z-10 shadow-md">
        Upgrade Plan
      </Button>
    </div>
  );
}
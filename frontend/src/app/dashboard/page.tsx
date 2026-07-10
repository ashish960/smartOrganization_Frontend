"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { AppRootState } from "@/store";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TrialBanner from "@/components/dashboard/TrialBanner";
import StatsGrid from "@/components/dashboard/StatsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import Button from "@/components/ui/Button";

function DemoInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md flex items-center justify-center p-5" onClick={onClose}>
      <div 
        className="bg-surface rounded-2xl border border-border p-7 w-full max-w-[480px] shadow-2xl flex flex-col gap-5 animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <span className="text-4xl">🚀</span>
          <h2 className="text-xl font-bold text-text-primary tracking-tight mt-3">Welcome to SmartOrg AI</h2>
          <p className="text-xs text-text-muted mt-1">Portfolio Review & Demo Environment</p>
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-text-secondary leading-relaxed">
          This project was built to demonstrate document intelligence, department permissions access matrices, and semantic AI chat. To prevent AWS storage bloat and Gemini API token charges, this workspace runs in **Demo / Trial mode** with the following limits:
        </div>

        <div className="flex flex-col gap-3.5 my-1">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-lg">💬</span>
            <div>
              <p className="font-bold text-text-primary">3 AI Chat Messages</p>
              <p className="text-xs text-text-muted">You can ask the AI assistant up to 3 questions in total.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-lg">📁</span>
            <div>
              <p className="font-bold text-text-primary">3 Documents Maximum</p>
              <p className="text-xs text-text-muted">You can upload and store up to 3 documents in the workspace.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-lg">📏</span>
            <div>
              <p className="font-bold text-text-primary">1 MB File Size Limit</p>
              <p className="text-xs text-text-muted">Uploaded files must be smaller than 1 MB to conserve S3 space.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-lg">👥</span>
            <div>
              <p className="font-bold text-text-primary">2 Team Members</p>
              <p className="text-xs text-text-muted">Invitation capacity is limited to 2 active users.</p>
            </div>
          </div>
        </div>

        <Button onClick={onClose} variant="primary" className="w-full mt-2">
          Explore Workspace
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((state: AppRootState) => state.auth);
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    if (user?.email && user.email !== "owner@smartorg.com") {
      const dismissed = sessionStorage.getItem("demo_modal_dismissed");
      if (!dismissed) {
        setShowDemoModal(true);
      }
    }
  }, [user]);

  const handleDismissModal = () => {
    sessionStorage.setItem("demo_modal_dismissed", "true");
    setShowDemoModal(false);
  };

  return (
    <DashboardLayout title="Dashboard" noScroll={true}>
      {showDemoModal && <DemoInfoModal onClose={handleDismissModal} />}
      <TrialBanner />
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <QuickActions />
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
}
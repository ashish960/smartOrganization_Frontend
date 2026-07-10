"use client";

import { useRouter } from "next/navigation";
import { Icons } from "@/constants/icons";
import { QUICK_ACTIONS } from "@/constants/navigation";
import Card from "@/components/ui/Card";

const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  primary:   { text: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20"   },
  secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  success:   { text: "text-success",   bg: "bg-success/10",   border: "border-success/20"   },
  warning:   { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20"   },
  error:     { text: "text-error",     bg: "bg-error/10",     border: "border-error/20"     },
};

export default function QuickActions() {
  const router = useRouter();

  return (
    <Card className="h-full flex flex-col">
      <h3 className="text-base font-bold text-text-primary tracking-tight mb-4">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[215px] pr-1.5 custom-scrollbar">
        {QUICK_ACTIONS.map((action) => {
          const IconComp = Icons[action.icon];
          const colors = colorMap[action.color] ?? colorMap.primary;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-sm border ${colors.border} ${colors.bg}`}
            >
              <span
                className={`flex items-center justify-center p-1.5 rounded-lg transition-transform group-hover:scale-110 ${colors.bg} ${colors.text}`}
              >
                <IconComp />
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {action.label}
              </span>
              <span className="ml-auto text-text-muted opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <Icons.ChevronRight />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
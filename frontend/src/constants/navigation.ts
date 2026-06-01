import { IconName } from "./icons";

export interface NavItem {
  label: string;
  icon: IconName;
  href: string;
}

// Single source of truth for all sidebar navigation
// To add a new page: just add an entry here — sidebar updates automatically
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",   icon: "Dashboard",   href: "/dashboard"                          },
  { label: "Documents",   icon: "Documents",   href: "/documents"      },
  { label: "AI Chat",     icon: "AI",          href: "/coming-soon?feature=AI Chat"        },
  { label: "Departments", icon: "Department", href: "/departments" },
  { label: "Team", icon: "Users", href: "/team" },
  { label: "Analytics",   icon: "Analytics",   href: "/coming-soon?feature=Analytics"      },
  { label: "Settings",    icon: "Settings",    href: "/coming-soon?feature=Settings"       },
];

export const QUICK_ACTIONS = [
  { label: "Upload Document", icon: "Upload", color: "#3b82f6", href: "/documents" },
  { label: "Start AI Chat",   icon: "AI"         as IconName, color: "#a855f7", href: "/coming-soon?feature=AI Chat"     },
  { label: "Invite Members",  icon: "Users"      as IconName, color: "#10b981", href: "/coming-soon?feature=Team"        },
  { label: "Add Department",  icon: "Department" as IconName, color: "#f59e0b", href: "/coming-soon?feature=Departments" },
];

export const STAT_CARDS = [
  {
    label: "Total Documents",
    value: "0",
    sub: "Upload your first doc",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    icon: "Documents" as IconName,
  },
  {
    label: "AI Queries",
    value: "0",
    sub: "100 queries available",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    icon: "AI" as IconName,
  },
  {
    label: "Team Members",
    value: "1",
    sub: "You're the admin",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    icon: "Users" as IconName,
  },
  {
    label: "Storage Used",
    value: "0 MB",
    sub: "1 GB available",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    icon: "Analytics" as IconName,
  },
];
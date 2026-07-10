import { IconName } from "./icons";

export interface NavItem {
  label: string;
  icon: IconName;
  href: string;
}

// Single source of truth for all sidebar navigation
// To add a new page: just add an entry here — sidebar updates automatically
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",   icon: "Dashboard",   href: "/dashboard"   },
  { label: "Documents",   icon: "Documents",   href: "/documents"   },
  { label: "AI Chat",     icon: "AI",          href: "/chat"        },
  { label: "Departments", icon: "Department",  href: "/departments" },
  { label: "Team",        icon: "Users",       href: "/team"        },
  { label: "Analytics",   icon: "Analytics",   href: "/analytics"   },
  { label: "Settings",    icon: "Settings",    href: "/settings"    },
];

export const QUICK_ACTIONS = [
  { label: "Upload Document", icon: "Upload"     as IconName, color: "primary"   as const, href: "/documents"   },
  { label: "Start AI Chat",   icon: "AI"         as IconName, color: "secondary" as const, href: "/chat"        },
  { label: "Invite Members",  icon: "Users"      as IconName, color: "success"   as const, href: "/team"        },
  { label: "Add Department",  icon: "Department" as IconName, color: "warning"   as const, href: "/departments" },
];

export const STAT_CARDS = [
  {
    label: "Total Documents",
    value: "0",
    sub: "Upload your first doc",
    color: "primary" as const,
    icon: "Documents" as IconName,
  },
  {
    label: "AI Queries",
    value: "0",
    sub: "100 queries available",
    color: "secondary" as const,
    icon: "AI" as IconName,
  },
  {
    label: "Team Members",
    value: "1",
    sub: "You're the admin",
    color: "success" as const,
    icon: "Users" as IconName,
  },
  {
    label: "Storage Used",
    value: "0 MB",
    sub: "1 GB available",
    color: "warning" as const,
    icon: "Analytics" as IconName,
  },
];
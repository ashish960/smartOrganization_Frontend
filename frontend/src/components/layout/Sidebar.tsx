"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/constants/icons";
import { NAV_ITEMS } from "@/constants/navigation";
import Avatar from "@/components/ui/Avatar";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userName: string;
  orgName: string;
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  userName,
  orgName,
  onLogout,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col flex-shrink-0 sticky top-0 h-screen bg-surface border-r border-border transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
        isOpen ? "w-64" : "w-[72px]"
      }`}
    >
      {/* ── Logo + Toggle ── */}
      <div
        className={`flex items-center px-4 py-5 border-b border-border transition-all duration-300 ${
          isOpen ? "justify-between" : "justify-center"
        }`}
      >
        {isOpen && (
          <span className="text-lg font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap tracking-tight">
            SmartOrg AI
          </span>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors flex-shrink-0"
        >
          {isOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight16 />}
        </button>
      </div>

      {/* ── Org Badge ── */}
      {isOpen && (
        <div className="mx-4 mt-4 mb-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wider">
            Organization
          </p>
          <p className="text-sm font-semibold truncate text-text-primary">
            {orgName}
          </p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const IconComp = Icons[item.icon];
          const isActive = pathname === item.href;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              title={!isOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-lg border-l-2 transition-all duration-200 group ${
                isOpen ? "justify-start px-3 py-2.5" : "justify-center p-2.5"
              } ${
                isActive
                  ? "bg-primary/10 text-primary border-primary font-semibold"
                  : "bg-transparent text-text-muted border-transparent hover:bg-surface-hover hover:text-text-primary font-medium"
              }`}
            >
              <span
                className={`flex-shrink-0 transition-transform duration-200 ${
                  isActive ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
                }`}
              >
                <IconComp />
              </span>
              {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div className="p-4 border-t border-border">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <Avatar name={userName} size={36} fontSize={14} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-text-primary">
                {userName}
              </p>
              <p className="text-[11px] font-medium text-text-muted mt-0.5">ORG_ADMIN</p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
            >
              <Icons.Logout />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <Icons.Logout />
          </button>
        )}
      </div>
    </aside>
  );
}
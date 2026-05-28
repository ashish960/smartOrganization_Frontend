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
  const pathname = usePathname(); // highlights active nav item automatically

  return (
    <aside style={{
      width: isOpen ? "240px" : "68px",
      minHeight: "100vh",
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.25s ease",
      overflow: "hidden",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
    }}>

      {/* ── Logo + Toggle ── */}
      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: isOpen ? "space-between" : "center",
        gap: "10px",
      }}>
        {isOpen && (
          <span style={{
            fontSize: "16px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #3b82f6, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            whiteSpace: "nowrap",
          }}>
            SmartOrg AI
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-muted)", padding: "4px",
            borderRadius: "6px", display: "flex", alignItems: "center", flexShrink: 0,
          }}
        >
          {isOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight16 />}
        </button>
      </div>

      {/* ── Org Badge ── */}
      {isOpen && (
        <div style={{
          margin: "12px 12px 4px",
          padding: "10px 12px",
          borderRadius: "10px",
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.15)",
        }}>
          <p style={{
            fontSize: "10px", color: "rgba(59,130,246,0.8)", fontWeight: "600",
            marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            Organization
          </p>
          <p style={{
            fontSize: "13px", fontWeight: "600",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {orgName}
          </p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const IconComp = Icons[item.icon];
          const isActive = pathname === item.href;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              title={!isOpen ? item.label : undefined}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: isOpen ? "9px 12px" : "9px",
                justifyContent: isOpen ? "flex-start" : "center",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                marginBottom: "2px",
                transition: "all 0.15s ease",
                background: isActive
                  ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15))"
                  : "transparent",
                color: isActive ? "var(--color-text)" : "var(--color-text-muted)",
                fontWeight: isActive ? "600" : "400",
                fontSize: "14px",
                borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
              }}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
                <IconComp />
              </span>
              {isOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--color-border)" }}>
        {isOpen ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar name={userName} size={32} fontSize={13} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: "13px", fontWeight: "600",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {userName}
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>ORG_ADMIN</p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-muted)", padding: "4px",
                borderRadius: "6px", flexShrink: 0,
              }}
            >
              <Icons.Logout />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-muted)", padding: "8px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icons.Logout />
          </button>
        )}
      </div>
    </aside>
  );
}
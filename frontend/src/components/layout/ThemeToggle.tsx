"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button style={{
        background: "var(--color-btn-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "8px",
        width: "38px",
        height: "38px",
      }} />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{
        background: "var(--color-btn-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "8px",
        cursor: "pointer",
        color: "var(--color-text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

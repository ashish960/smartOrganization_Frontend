"use client";

interface AvatarProps {
  name: string;
  size?: number;
  fontSize?: number;
}

// Reusable avatar — shows first letter of name with gradient background
export default function Avatar({ name, size = 34, fontSize = 13 }: AvatarProps) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #3b82f6, #a855f7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: `${fontSize}px`,
      fontWeight: "700",
      color: "#fff",
      flexShrink: 0,
      cursor: "pointer",
      userSelect: "none",
    }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
"use client";

interface AvatarProps {
  name: string;
  size?: number;
  fontSize?: number;
}

export default function Avatar({ name, size = 34, fontSize = 13 }: AvatarProps) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex-shrink-0 cursor-pointer select-none shadow-sm hover:shadow-md transition-shadow"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
      }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
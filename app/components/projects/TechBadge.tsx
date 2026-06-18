// Tech badge color map - one accent color per category
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  frontend: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  backend:  { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  database: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  infra:    { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  ai:       { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  mobile:   { bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
};

interface TechBadgeProps {
  name: string;
  category: "frontend" | "backend" | "database" | "infra" | "ai" | "mobile";
  size?: "sm" | "md";
}

export function TechBadge({ name, category, size = "sm" }: TechBadgeProps) {
  const colors = categoryColors[category] ?? categoryColors.frontend;
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  const padding = size === "md" ? "px-3 py-1.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center ${padding} rounded-full ${textSize} font-semibold border`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {name}
    </span>
  );
}

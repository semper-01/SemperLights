import { cn } from "@/utils/helpers";

type StatusVariant = "pending" | "confirmed" | "completed" | "cancelled" | "published" | "draft" | "archived" | "active" | "inactive" | "read" | "unread" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const colorMap: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  published: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  read: "bg-gray-100 text-gray-600 border-gray-200",
  unread: "bg-blue-100 text-blue-800 border-blue-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
  yes: "bg-green-100 text-green-800 border-green-200",
  no: "bg-red-100 text-red-800 border-red-200",
  featured: "bg-purple-100 text-purple-800 border-purple-200",
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const key = variant ?? status?.toLowerCase() ?? "default";
  const colorClass = colorMap[key] ?? colorMap.default;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}
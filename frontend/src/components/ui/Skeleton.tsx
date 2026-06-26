import { cn } from "@/utils/helpers";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 p-6">
      <Skeleton variant="circular" width={48} height={48} className="mb-4" />
      <Skeleton className="mb-2 w-3/4" />
      <Skeleton className="mb-4 w-1/2" />
      <Skeleton className="mb-2 w-full" />
      <Skeleton className="w-2/3" />
    </div>
  );
}
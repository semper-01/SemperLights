import { cn } from "@/utils/helpers";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  /** @deprecated Use `message` instead. */
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}


export function EmptyState({
  title = "No data found",
  message = "There are no items to display at this time.",
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 text-gray-300">
        <svg
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{message}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
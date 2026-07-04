import { useEffect, useCallback, useRef, ReactNode } from "react";
import { cn } from "@/utils/helpers";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Focus the modal on open
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";

      // Restore focus to the previously active element
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] shadow-xl",
          sizeStyles[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-6 py-4">
          {title ? (
            <h2 id="modal-title" className="pr-8 text-lg font-semibold text-[color:var(--text)]">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)]"
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
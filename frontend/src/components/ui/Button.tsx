import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/helpers";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isFullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 disabled:bg-amber-400",
  secondary:
    "bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-700 disabled:bg-gray-400",
  outline:
    "border-2 border-amber-600 text-amber-600 hover:bg-amber-50 focus:ring-amber-500 disabled:border-gray-300 disabled:text-gray-300",
  ghost:
    "text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      isFullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          isFullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);



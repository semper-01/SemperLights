import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/helpers";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="flex items-center gap-2 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500",
              className
            )}
            {...props}
          />
          {label && (
            <span className="text-sm text-gray-700">{label}</span>
          )}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
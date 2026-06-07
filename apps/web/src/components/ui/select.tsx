import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const reactId = React.useId();
    const sid = id ?? reactId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={sid}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={sid}
          className={cn(
            "block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:ring-brand-500",
            error &&
              "border-rose-400 focus:border-rose-500 focus:ring-rose-500",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Textarea, type TextareaProps } from "./textarea";

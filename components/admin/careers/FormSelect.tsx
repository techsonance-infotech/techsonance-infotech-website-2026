"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      className,
      children,
      id,
      ...props
    },
    ref,
  ): React.JSX.Element => {
    const generatedId = React.useId();
    const selectId = id ?? (label ? `select-${generatedId}` : undefined);
    const helperId = selectId ? `${selectId}-helper` : undefined;
    const errorId = selectId ? `${selectId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            {label} {required ? <span className="text-rose-500">*</span> : null}
          </label>
        ) : null}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-3.5 pr-9 text-xs font-medium text-slate-900 dark:text-white shadow-2xs transition-colors",
              "focus:outline-hidden focus:ring-2 focus:ring-[#1155CC] focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500" : "",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {helperText && !error ? (
          <p id={helperId} className="text-[11px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

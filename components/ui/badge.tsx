import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white shadow hover:bg-slate-900/80",
        secondary: "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        destructive: "border border-rose-200/80 border-transparent bg-rose-50 text-rose-700",
        outline: "border border-slate-200 text-slate-800",
        success: "border border-emerald-200/80 bg-emerald-50 text-emerald-700",
        warning: "border border-amber-200/80 bg-amber-50 text-amber-700",
        info: "border border-blue-200/80 bg-blue-50 text-blue-700",
        purple: "border border-purple-200/80 bg-purple-50 text-purple-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "animate-pulse bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "destructive" && "bg-rose-500",
            variant === "info" && "bg-blue-500",
            variant === "purple" && "bg-purple-500",
            (!variant || variant === "default") && "bg-white",
            variant === "secondary" && "bg-slate-500",
            variant === "outline" && "bg-slate-500",
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

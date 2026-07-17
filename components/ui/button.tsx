import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Icon } from "@/app/components/icons/Icon"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold uppercase tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1155CC] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-center select-none relative z-10",
  {
    variants: {
      variant: {
        default:
          "group cursor-pointer rounded-full bg-[#1155CC] text-white shadow-[0_4px_14px_rgba(17,85,204,0.35)] hover:-translate-y-0.5 hover:bg-[#0d3f99] hover:shadow-[0_10px_28px_rgba(17,85,204,0.45)] active:translate-y-0 active:shadow-[0_4px_14px_rgba(17,85,204,0.35)]",
        primary:
          "group cursor-pointer rounded-full bg-[#1155CC] text-white shadow-[0_4px_14px_rgba(17,85,204,0.35)] hover:-translate-y-0.5 hover:bg-[#0d3f99] hover:shadow-[0_10px_28px_rgba(17,85,204,0.45)] active:translate-y-0 active:shadow-[0_4px_14px_rgba(17,85,204,0.35)]",
        outline:
          "group cursor-pointer rounded-full border border-gray-300 text-gray-800 hover:-translate-y-0.5 hover:border-[#1155CC] hover:text-[#1155CC] hover:shadow-[0_8px_20px_rgba(17,85,204,0.15)] active:translate-y-0 bg-transparent",
        secondary:
          "group cursor-pointer rounded-full border border-gray-300 text-gray-800 hover:-translate-y-0.5 hover:border-[#1155CC] hover:text-[#1155CC] hover:shadow-[0_8px_20px_rgba(17,85,204,0.15)] active:translate-y-0 bg-transparent",
        ghost:
          "rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium normal-case tracking-normal",
        link:
          "text-[#1155CC] underline-offset-4 hover:underline font-medium normal-case tracking-normal p-0 h-auto bg-transparent",
      },
      size: {
        default: "px-5 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px]",
        sm: "px-4 py-2 sm:px-5 sm:py-2.5 text-[11px] sm:text-xs min-h-[38px] sm:min-h-[40px]",
        lg: "px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base min-h-[50px] sm:min-h-[54px]",
        icon: "p-2.5 sm:p-3 aspect-square",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  showArrow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, showArrow = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isPrimary = variant === "default" || variant === "primary"
    const isSecondary = variant === "outline" || variant === "secondary"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "overflow-hidden")}
        ref={ref}
        {...props}
      >
        <Slottable>{children}</Slottable>
        {isPrimary && (
          // subtle diagonal sheen that sweeps across on hover
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent
            transition-transform duration-700 ease-out group-hover:translate-x-full z-0"
          />
        )}
        {showArrow && isPrimary && (
          <Icon
            name="arrow"
            className="relative h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1 shrink-0"
          />
        )}
        {showArrow && isSecondary && (
          <Icon
            name="arrow"
            className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 shrink-0"
          />
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

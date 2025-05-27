import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-red-100 text-red-700 [a&]:hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50 border",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-green-100 text-green-700 [a&]:hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50 border",
        warning:
          "border-transparent bg-amber-100 text-amber-700 [a&]:hover:bg-amber-100/80 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/50 border",
        "agent-pending":
          "border-transparent bg-sky-100 text-sky-700 [a&]:hover:bg-sky-100/80 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700/50 border",
        "lead-pending":
          "border-transparent bg-yellow-100 text-yellow-700 [a&]:hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50 border",
        "supervisor-pending":
          "border-transparent bg-purple-100 text-purple-700 [a&]:hover:bg-purple-100/80 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50 border",
        "client-action":
          "border-transparent bg-pink-100 text-pink-700 [a&]:hover:bg-pink-100/80 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/50 border",
        "approved":
          "border-transparent bg-teal-100 text-teal-700 [a&]:hover:bg-teal-100/80 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700/50 border",
        "processing":
          "border-transparent bg-blue-100 text-blue-700 [a&]:hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50 border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }

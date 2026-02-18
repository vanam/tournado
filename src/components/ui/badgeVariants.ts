import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-primary)] text-white",
        secondary: "border-transparent bg-[var(--color-soft)] text-[var(--color-text)]",
        accent: "border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
        outline: "border-[var(--color-border)] text-[var(--color-text)]",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

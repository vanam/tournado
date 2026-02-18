import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-primary)] border border-[var(--color-border)] text-[var(--color-surface)] hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary)] hover:shadow-sm",
        accent: "bg-[var(--color-accent)] text-[var(--color-surface)] hover:bg-[var(--color-primary-dark)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] font-normal",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "font-normal text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]",
        link: "text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-5 py-2 text-sm",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

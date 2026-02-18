import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] border border-[var(--color-primary)] text-[var(--color-surface)] hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)]",
        secondary:
          "bg-[var(--color-accent)] border border-[var(--color-accent)] text-[var(--color-surface)] hover:brightness-90",
        "primary-outlined":
          "border border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-surface)] font-normal",
        "secondary-outlined":
          "border border-[var(--color-accent)] bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-surface)] font-normal",
        link: "text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] underline-offset-4 hover:underline",
        ghost: "font-normal text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-5 py-2 text-sm",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

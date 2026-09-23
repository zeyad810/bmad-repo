import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

// Border color lives only in the variant maps (never in BASE_CLASS) so no
// element carries two conflicting utilities for the same property.
const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 border font-medium transition-opacity enabled:hover:opacity-85 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

// Danger has no red token in Graphite Violet: it's an inverted --text fill,
// shown only for an armed (confirm-pending) delete — never on first tap.
const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border-transparent bg-[var(--accent)] text-[var(--bg)]",
  secondary: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]",
  ghost: "border-transparent bg-transparent text-[var(--text-dim)] hover:text-[var(--text)]",
  danger: "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]",
};

// rounded-sm is 8px in this theme (@theme overrides --radius-*).
const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "rounded-sm px-3.5 py-1.5 text-meta min-h-8",
  md: "rounded-sm px-4 py-2.5 text-secondary min-h-10",
  lg: "rounded-sm px-6 py-3.5 text-body min-h-12",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-variant={variant}
        className={[BASE_CLASS, VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

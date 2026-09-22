import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--color-accent)",
    color: "white",
    border: "none",
  },
  secondary: {
    background: "var(--color-surface-2)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border-2)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-muted)",
    border: "none",
  },
  danger: {
    background: "var(--color-critical-subtle)",
    color: "var(--color-critical)",
    border: "1px solid rgba(239,68,68,0.2)",
  },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "5px 12px", fontSize: 12, borderRadius: "var(--radius-sm)" },
  md: { padding: "8px 16px", fontSize: 14, borderRadius: "var(--radius-md)" },
  lg: { padding: "11px 22px", fontSize: 15, borderRadius: "var(--radius-md)" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", style, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontWeight: 500,
          cursor: "pointer",
          transition: "opacity 0.15s ease, transform 0.1s ease",
          ...VARIANT_STYLES[variant],
          ...SIZE_STYLES[size],
          ...style,
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

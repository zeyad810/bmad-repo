import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: number | string;
  hoverable?: boolean;
}

export function Card({ padding = 20, hoverable = false, style, children, ...props }: CardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding,
        transition: hoverable ? "border-color 0.15s ease, background 0.15s ease" : undefined,
        ...style,
      }}
      onMouseOver={
        hoverable
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "var(--color-border-2)";
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--color-surface-2)";
            }
          : undefined
      }
      onMouseOut={
        hoverable
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
              (e.currentTarget as HTMLDivElement).style.background = "var(--color-surface)";
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

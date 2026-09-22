interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: 12,
        color: "var(--color-text-muted)",
        textAlign: "center",
      }}
    >
      {icon && (
        <div style={{ fontSize: 40, marginBottom: 4, opacity: 0.5 }}>{icon}</div>
      )}
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{title}</p>
      {description && <p style={{ fontSize: 13, maxWidth: 320 }}>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

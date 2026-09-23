import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

// Spacing is min-height + gap only: the unlayered global reset in globals.css
// (`* { margin: 0; padding: 0 }`) overrides Tailwind's padding/margin utilities.
// min-h-32 (128px) also keeps the home page's SectionDropZone drop target sizable.
const ROOT_CLASS = "flex min-h-32 flex-col items-center justify-center gap-4 text-center";
const TEXT_GROUP_CLASS = "flex flex-col items-center gap-1";
const TITLE_CLASS = "text-body font-medium text-[var(--text-dim)]";
const DESCRIPTION_CLASS = "max-w-xs text-secondary text-[var(--text-dim)]";

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className={ROOT_CLASS}>
      <div className={TEXT_GROUP_CLASS}>
        <p className={TITLE_CLASS}>{title}</p>
        {description && <p className={DESCRIPTION_CLASS}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

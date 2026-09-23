import { arrayMove } from "@dnd-kit/sortable";

export type Section = "today" | "backlog";

export interface ResolveDropInput {
  activeId: string;
  overId: string;
  /** Current Today ids, in rendered order. */
  today: string[];
  /** Current Backlog ids, in rendered order. */
  backlog: string[];
  isKeyboard: boolean;
}

export type DropResult =
  | { kind: "reorder"; section: Section; orderedIds: string[] }
  | { kind: "move"; section: Section; status: "next" | "backlog"; orderedIds: string[] };

const DROPZONE_SECTION: Record<string, Section> = {
  "today-dropzone": "today",
  "backlog-dropzone": "backlog",
};

function sectionOf(id: string, today: string[], backlog: string[]): Section | null {
  if (today.includes(id)) return "today";
  if (backlog.includes(id)) return "backlog";
  return null;
}

/**
 * Single source of truth for where a drag lands — used both to commit the
 * drop and to announce it, so what a screen reader hears is what is saved.
 */
export function resolveDrop({ activeId, overId, today, backlog, isKeyboard }: ResolveDropInput): DropResult | null {
  if (activeId === overId) return null;

  const source = sectionOf(activeId, today, backlog);
  if (!source) return null;

  const dest = DROPZONE_SECTION[overId] ?? sectionOf(overId, today, backlog);
  if (!dest) return null;

  if (dest === source) {
    // Same-section drag: position only, no status change
    const list = source === "today" ? today : backlog;
    const oldIndex = list.indexOf(activeId);
    const newIndex = list.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return null;
    return { kind: "reorder", section: source, orderedIds: arrayMove(list, oldIndex, newIndex) };
  }

  // Cross-section drag: atomic status+position via moveTask
  const destIds = [...(dest === "today" ? today : backlog)];
  const overIndex = destIds.indexOf(overId);
  if (overIndex < 0) {
    destIds.push(activeId); // dropped on the empty-section dropzone
  } else {
    // Keyboard ↑ from the top of Backlog targets the last Today row; inserting
    // after it keeps each key press one slot (pointer drops keep insert-before).
    const promotingByKeyboard = isKeyboard && source === "backlog" && dest === "today";
    destIds.splice(promotingByKeyboard ? overIndex + 1 : overIndex, 0, activeId);
  }
  return { kind: "move", section: dest, status: dest === "today" ? "next" : "backlog", orderedIds: destIds };
}

export function describePosition(result: DropResult, activeId: string) {
  return {
    position: result.orderedIds.indexOf(activeId) + 1,
    total: result.orderedIds.length,
    sectionLabel: result.section === "today" ? "Today" : "Backlog",
  } as const;
}

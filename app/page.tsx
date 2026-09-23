"use client";

import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  Announcements,
  DragEndEvent,
  DragStartEvent,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { describePosition, resolveDrop } from "@/lib/reorder/resolve-drop";
import { useTaskStore } from "@/stores/task-store";
import { useTodaySectionTasks, useBacklogSectionTasks } from "@/hooks/useTasks";
import { DraggableTaskList, SectionDropZone } from "@/components/tasks/DraggableTaskList";
import { QuickAddBar } from "@/components/tasks/QuickAddBar";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { HydrationSkeleton } from "@/components/tasks/HydrationSkeleton";
import { Task } from "@/types";

// Read via the drag handle's aria-describedby.
const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To reorder, press Space or Enter to pick up the task. Use the up and down arrow keys to move it, " +
    "including across the Today and Backlog divider. Press Space or Enter to drop, or Escape to cancel.",
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomePage() {
  const { addTask, settings, reorderTasks, setSortMode, moveTask, hydrated } = useTaskStore();
  const todayTasks = useTodaySectionTasks();
  const backlogTasks = useBacklogSectionTasks();
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // 4px movement before drag activates, prevents accidental clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Set on drag start; keyboard promotes resolve differently (see resolveDrop).
  const isKeyboardDragRef = useRef(false);
  const todayIds = todayTasks.map((t) => t.id);
  const backlogIds = backlogTasks.map((t) => t.id);

  function resolve(activeId: UniqueIdentifier, overId: UniqueIdentifier) {
    return resolveDrop({
      activeId: String(activeId),
      overId: String(overId),
      today: todayIds,
      backlog: backlogIds,
      isKeyboard: isKeyboardDragRef.current,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    isKeyboardDragRef.current = event.activatorEvent instanceof KeyboardEvent;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const result = resolve(active.id, over.id);
    if (!result) return;

    setSortMode("manual");
    if (result.kind === "reorder") reorderTasks(result.orderedIds);
    else moveTask(String(active.id), result.status, result.orderedIds);
  }

  // Human-readable text for @dnd-kit's built-in live region — never raw ids.
  function titleOf(id: UniqueIdentifier) {
    return [...todayTasks, ...backlogTasks].find((t) => t.id === String(id))?.title ?? "Task";
  }

  function currentPosition(id: UniqueIdentifier) {
    const inToday = todayIds.indexOf(String(id));
    return inToday >= 0
      ? `position ${inToday + 1} of ${todayIds.length} in Today`
      : `position ${backlogIds.indexOf(String(id)) + 1} of ${backlogIds.length} in Backlog`;
  }

  function projected(activeId: UniqueIdentifier, overId: UniqueIdentifier) {
    const result = resolve(activeId, overId);
    if (!result) return null;
    const { position, total, sectionLabel } = describePosition(result, String(activeId));
    return `position ${position} of ${total} in ${sectionLabel}`;
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${titleOf(active.id)}. ${capitalize(currentPosition(active.id))}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return `${titleOf(active.id)} is not over a list.`;
      const where = projected(active.id, over.id);
      return where ? `${titleOf(active.id)} will move to ${where}.` : `${titleOf(active.id)} is at its original position.`;
    },
    onDragEnd({ active, over }) {
      const where = over ? projected(active.id, over.id) : null;
      return where ? `${titleOf(active.id)} moved to ${where}.` : `${titleOf(active.id)} dropped at its original position.`;
    },
    onDragCancel({ active }) {
      return `Reorder cancelled. ${titleOf(active.id)} returned to ${currentPosition(active.id)}.`;
    },
  };

  function handleQuickAdd(title: string) {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const priority = settings.defaultPriority;
    const score = priority === "critical" ? 9 : priority === "high" ? 7 : priority === "medium" ? 5 : 3;
    addTask({
      title: cleanTitle,
      priority,
      status: "next",
      importance: score,
      urgency: score,
      tags: [],
      dependencies: [],
      isPinned: false,
    });
  }

  function handleEdit(task: Task) {
    setEditTask(task);
    setDrawerOpen(true);
  }

  if (!hydrated) {
    return <HydrationSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h1 className="sr-only">My tasks</h1>
      <QuickAddBar onAdd={handleQuickAdd} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="sr-only">Today</h2>
          {todayTasks.length === 0 ? (
            <SectionDropZone id="today-dropzone">
              <EmptyState title="Nothing here yet" />
            </SectionDropZone>
          ) : (
            <DraggableTaskList tasks={todayTasks} onEdit={handleEdit} />
          )}
        </section>

        <SectionDivider label="BACKLOG" id="backlog-heading" />

        <section aria-labelledby="backlog-heading">
          {backlogTasks.length === 0 ? (
            <SectionDropZone id="backlog-dropzone">
              <EmptyState title="Backlog is clear" />
            </SectionDropZone>
          ) : (
            <DraggableTaskList tasks={backlogTasks} isBacklog onEdit={handleEdit} />
          )}
        </section>
      </DndContext>

      <TaskDrawer open={drawerOpen} task={editTask} onClose={() => { setDrawerOpen(false); setEditTask(undefined); }} />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useTaskStore } from "@/stores/task-store";
import { useTodaySectionTasks, useBacklogSectionTasks } from "@/hooks/useTasks";
import { DraggableTaskList, SectionDropZone } from "@/components/tasks/DraggableTaskList";
import { QuickAddBar } from "@/components/tasks/QuickAddBar";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { HydrationSkeleton } from "@/components/tasks/HydrationSkeleton";
import { Task } from "@/types";

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

  function sectionOf(id: string): "today" | "backlog" | null {
    if (todayTasks.some((t) => t.id === id)) return "today";
    if (backlogTasks.some((t) => t.id === id)) return "backlog";
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceSection = sectionOf(activeId);
    if (!sourceSection) return;

    const destSection =
      overId === "today-dropzone" ? "today" :
      overId === "backlog-dropzone" ? "backlog" :
      sectionOf(overId);
    if (!destSection) return;

    setSortMode("manual");

    if (destSection === sourceSection) {
      // Same-section drag: position only, no status change
      const list = sourceSection === "today" ? todayTasks : backlogTasks;
      const oldIndex = list.findIndex((t) => t.id === activeId);
      const newIndex = list.findIndex((t) => t.id === overId);
      if (oldIndex < 0 || newIndex < 0) return;
      reorderTasks(arrayMove(list, oldIndex, newIndex).map((t) => t.id));
    } else {
      // Cross-section drag: atomic status+position via moveTask
      const destList = destSection === "today" ? todayTasks : backlogTasks;
      const destIds = destList.map((t) => t.id);
      const insertAt = destIds.indexOf(overId);
      if (insertAt >= 0) destIds.splice(insertAt, 0, activeId);
      else destIds.push(activeId); // dropped on the empty-section dropzone
      moveTask(activeId, destSection === "today" ? "next" : "backlog", destIds);
    }
  }

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
      <QuickAddBar onAdd={handleQuickAdd} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <section>
          {todayTasks.length === 0 ? (
            <SectionDropZone id="today-dropzone">
              <EmptyState title="Nothing here yet" />
            </SectionDropZone>
          ) : (
            <DraggableTaskList tasks={todayTasks} onEdit={handleEdit} />
          )}
        </section>

        <SectionDivider label="BACKLOG" />

        <section>
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

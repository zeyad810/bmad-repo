"use client";

import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import { TaskRow } from "./TaskRow";

function SortableTaskRow({
  task,
  isBacklog,
  onEdit,
}: {
  task: Task;
  isBacklog?: boolean;
  onEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
      }}
      className="w-full relative"
    >
      <TaskRow
        task={task}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        isBacklog={isBacklog}
        onEdit={onEdit}
      />
    </div>
  );
}

interface DraggableTaskListProps {
  tasks: Task[];
  isBacklog?: boolean;
  onEdit: (task: Task) => void;
}

export function DraggableTaskList({ tasks, isBacklog, onEdit }: DraggableTaskListProps) {
  return (
    <SortableContext
      items={tasks.map((t) => t.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="flex flex-col gap-4 py-1">
        {tasks.map((task) => (
          <SortableTaskRow
            key={task.id}
            task={task}
            isBacklog={isBacklog}
            onEdit={onEdit}
          />
        ))}
      </div>
    </SortableContext>
  );
}

export function SectionDropZone({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

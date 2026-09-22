"use client";

import { Drawer } from "@/components/ui/Drawer";
import { TaskForm } from "./TaskForm";
import { Task } from "@/types";

interface TaskDrawerProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
}

export function TaskDrawer({ open, task, onClose }: TaskDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={task ? "Edit Task" : "New Task"}
    >
      {open && <TaskForm task={task} onClose={onClose} />}
    </Drawer>
  );
}

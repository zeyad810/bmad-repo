"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { useTaskStore } from "@/stores/task-store";
import { Button } from "@/components/ui/Button";
import { calculatePriorityScore } from "@/lib/prioritization/score";
import { useMemo } from "react";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["backlog", "next", "in-progress", "completed"]),
  importance: z.number().min(1).max(10),
  urgency: z.number().min(1).max(10),
  dueDate: z.string().optional(),
  estimatedMinutes: z.number().min(0).optional(),
  category: z.string().optional(),
  tags: z.string(), // comma-separated
  dependencies: z.array(z.string()),
  isPinned: z.boolean(),
});

type FormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "critical", label: "🔴 Critical", color: "var(--color-critical)" },
  { value: "high", label: "🟠 High", color: "var(--color-high)" },
  { value: "medium", label: "🟡 Medium", color: "var(--color-medium)" },
  { value: "low", label: "🟢 Low", color: "var(--color-low)" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "next", label: "Next Up" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border-2)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text)",
  padding: "9px 12px",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

export function TaskForm({ task, onClose }: TaskFormProps) {
  const { addTask, updateTask, tasks } = useTaskStore();
  const isEdit = !!task;

  const availableDependencies = tasks.filter(
    (t) => t.id !== task?.id && t.status !== "completed"
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: task?.priority ?? "medium",
      status: task?.status ?? "backlog",
      importance: task?.importance ?? 5,
      urgency: task?.urgency ?? 5,
      dueDate: task?.dueDate ?? "",
      estimatedMinutes: task?.estimatedMinutes,
      category: task?.category ?? "",
      tags: task?.tags.join(", ") ?? "",
      dependencies: task?.dependencies ?? [],
      isPinned: task?.isPinned ?? false,
    },
  });

  const importance = watch("importance");
  const urgency = watch("urgency");
  const priority = watch("priority");
  const dueDate = watch("dueDate");

  const liveScore = useMemo(() => {
    const mockTask: Task = {
      id: "preview",
      title: "preview",
      status: "backlog",
      priority,
      importance: Number(importance),
      urgency: Number(urgency),
      priorityScore: 0,
      dueDate: dueDate || undefined,
      tags: [],
      position: 0,
      isPinned: false,
      dependencies: [],
      createdAt: new Date().toISOString(),
    };
    return calculatePriorityScore(mockTask, tasks);
  }, [importance, urgency, priority, dueDate, tasks]);

  const onSubmit = (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      status: data.status,
      importance: Number(data.importance),
      urgency: Number(data.urgency),
      dueDate: data.dueDate || undefined,
      estimatedMinutes: data.estimatedMinutes ? Number(data.estimatedMinutes) : undefined,
      category: data.category || undefined,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      dependencies: data.dependencies,
      isPinned: data.isPinned,
    };

    if (isEdit) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Live Score */}
      <div
        style={{
          background: "var(--color-accent-subtle)",
          border: "1px solid rgba(124,109,250,0.2)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Priority Score</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--color-accent)" }}>
          {liveScore}
        </span>
      </div>

      {/* Title */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Title *</label>
        <input
          {...register("title")}
          placeholder="What needs to be done?"
          style={{ ...inputStyle, fontSize: 15 }}
          autoFocus
        />
        {errors.title && (
          <span style={{ color: "var(--color-critical)", fontSize: 12, marginTop: 4 }}>
            {errors.title.message}
          </span>
        )}
      </div>

      {/* Description */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          {...register("description")}
          placeholder="Add details..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Priority + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Priority</label>
          <select {...register("priority")} style={inputStyle}>
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Status</label>
          <select {...register("status")} style={inputStyle}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Importance */}
      <div style={fieldStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={labelStyle}>Importance</label>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent)" }}>
            {importance}/10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("importance", { valueAsNumber: true })}
          style={{ width: "100%", accentColor: "var(--color-accent)", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-subtle)", marginTop: 2 }}>
          <span>Not Important</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Urgency */}
      <div style={fieldStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={labelStyle}>Urgency</label>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-high)" }}>
            {urgency}/10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("urgency", { valueAsNumber: true })}
          style={{ width: "100%", accentColor: "var(--color-high)", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-subtle)", marginTop: 2 }}>
          <span>Can Wait</span>
          <span>Urgent Now</span>
        </div>
      </div>

      {/* Due Date + Estimate */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Due Date</label>
          <input type="date" {...register("dueDate")} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Est. Minutes</label>
          <input
            type="number"
            min={0}
            placeholder="e.g. 45"
            {...register("estimatedMinutes", { valueAsNumber: true })}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Category + Tags */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Category</label>
          <input {...register("category")} placeholder="e.g. Work" style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Tags</label>
          <input {...register("tags")} placeholder="tag1, tag2" style={inputStyle} />
        </div>
      </div>

      {/* Dependencies */}
      {availableDependencies.length > 0 && (
        <div style={fieldStyle}>
          <label style={labelStyle}>Blocked by (Dependencies)</label>
          <div
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border-2)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 140,
              overflowY: "auto",
            }}
          >
            {availableDependencies.map((dep) => (
              <label key={dep.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  value={dep.id}
                  {...register("dependencies")}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                <span style={{ color: "var(--color-text)" }}>{dep.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Pin */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
        <input
          type="checkbox"
          {...register("isPinned")}
          style={{ accentColor: "var(--color-accent)", width: 16, height: 16 }}
        />
        <span style={{ color: "var(--color-text-muted)" }}>📌 Pin this task to the top</span>
      </label>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <Button type="submit" variant="primary" size="md" style={{ flex: 1 }} disabled={isSubmitting}>
          {isEdit ? "Save Changes" : "Create Task"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

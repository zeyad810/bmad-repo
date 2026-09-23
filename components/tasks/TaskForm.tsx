"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pin } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { useTaskStore } from "@/stores/task-store";
import { Button } from "@/components/ui/Button";
import { PriorityDot } from "@/components/ui/PriorityDot";
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

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "next", label: "Next Up" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const FIELD_CLASS = "flex flex-col";
// Split so callers can swap margin / border color without conflicting utilities.
const LABEL_TEXT_CLASS = "block font-mono text-meta uppercase tracking-[0.08em] text-[var(--text-dim)]";
const LABEL_CLASS = `mb-2 ${LABEL_TEXT_CLASS}`;
const INPUT_BASE_CLASS =
  "w-full rounded-lg border bg-[var(--surface-2)] px-3.5 py-2.5 text-[var(--text)] placeholder:text-[var(--text-dim)] transition-colors focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const INPUT_CLASS = `${INPUT_BASE_CLASS} border-[var(--border)] text-secondary`;
const RANGE_CLASS = "w-full cursor-pointer accent-[var(--accent)]";
const RANGE_CAPTION_CLASS = "mt-1 flex justify-between text-meta text-[var(--text-dim)]";
const RANGE_VALUE_CLASS = "font-mono text-secondary tabular-nums text-[var(--accent)]";

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Live Score */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
        <span className="text-secondary text-[var(--text-dim)]">Priority Score</span>
        <span className="font-mono text-section font-semibold tabular-nums text-[var(--accent)]">
          {liveScore}
        </span>
      </div>

      {/* Title */}
      <div className={FIELD_CLASS}>
        <label htmlFor="task-title" className={LABEL_CLASS}>Title</label>
        <input
          id="task-title"
          {...register("title")}
          placeholder="What needs to be done?"
          aria-invalid={errors.title ? "true" : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={`${INPUT_BASE_CLASS} text-body ${errors.title ? "border-[var(--text-dim)]" : "border-[var(--border)]"}`}
          autoFocus
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-meta text-[var(--text-dim)]">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className={FIELD_CLASS}>
        <label htmlFor="task-description" className={LABEL_CLASS}>Description</label>
        <textarea
          id="task-description"
          {...register("description")}
          placeholder="Add details..."
          rows={3}
          className={`${INPUT_CLASS} resize-y`}
        />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className={FIELD_CLASS}>
          <label htmlFor="task-priority" className={LABEL_CLASS}>Priority</label>
          <div data-testid="priority-field" className="relative">
            <PriorityDot
              priority={priority}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            />
            <select id="task-priority" {...register("priority")} className={`${INPUT_BASE_CLASS} border-[var(--border)] pl-9 pr-4 text-secondary`}>
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={FIELD_CLASS}>
          <label htmlFor="task-status" className={LABEL_CLASS}>Status</label>
          <select id="task-status" {...register("status")} className={INPUT_CLASS}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Importance */}
      <div className={FIELD_CLASS}>
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="task-importance" className={LABEL_TEXT_CLASS}>Importance</label>
          <span className={RANGE_VALUE_CLASS}>{importance}/10</span>
        </div>
        <input
          id="task-importance"
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("importance", { valueAsNumber: true })}
          className={RANGE_CLASS}
        />
        <div className={RANGE_CAPTION_CLASS}>
          <span>Not Important</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Urgency */}
      <div className={FIELD_CLASS}>
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="task-urgency" className={LABEL_TEXT_CLASS}>Urgency</label>
          <span className={RANGE_VALUE_CLASS}>{urgency}/10</span>
        </div>
        <input
          id="task-urgency"
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("urgency", { valueAsNumber: true })}
          className={RANGE_CLASS}
        />
        <div className={RANGE_CAPTION_CLASS}>
          <span>Can Wait</span>
          <span>Urgent Now</span>
        </div>
      </div>

      {/* Due Date + Estimate */}
      <div className="grid grid-cols-2 gap-3">
        <div className={FIELD_CLASS}>
          <label htmlFor="task-due" className={LABEL_CLASS}>Due Date</label>
          <input id="task-due" type="date" {...register("dueDate")} className={INPUT_CLASS} />
        </div>
        <div className={FIELD_CLASS}>
          <label htmlFor="task-estimate" className={LABEL_CLASS}>Est. Minutes</label>
          <input
            id="task-estimate"
            type="number"
            min={0}
            placeholder="e.g. 45"
            {...register("estimatedMinutes", { valueAsNumber: true })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Category + Tags */}
      <div className="grid grid-cols-2 gap-3">
        <div className={FIELD_CLASS}>
          <label htmlFor="task-category" className={LABEL_CLASS}>Category</label>
          <input id="task-category" {...register("category")} placeholder="e.g. Work" className={INPUT_CLASS} />
        </div>
        <div className={FIELD_CLASS}>
          <label htmlFor="task-tags" className={LABEL_CLASS}>Tags</label>
          <input id="task-tags" {...register("tags")} placeholder="tag1, tag2" className={INPUT_CLASS} />
        </div>
      </div>

      {/* Dependencies */}
      {availableDependencies.length > 0 && (
        <fieldset className={FIELD_CLASS}>
          <legend className={LABEL_CLASS}>Blocked by (Dependencies)</legend>
          <div className="flex max-h-36 flex-col gap-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            {availableDependencies.map((dep) => (
              <label key={dep.id} className="flex cursor-pointer items-center gap-2 text-secondary">
                <input
                  type="checkbox"
                  value={dep.id}
                  {...register("dependencies")}
                  className="accent-[var(--accent)]"
                />
                <span className="text-[var(--text)]">{dep.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Pin */}
      <label className="flex cursor-pointer items-center gap-3 text-secondary">
        <input
          type="checkbox"
          {...register("isPinned")}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <Pin size={14} className="text-[var(--text-dim)]" aria-hidden="true" />
        <span className="text-[var(--text-dim)]">Pin this task to the top</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 border-t border-[var(--border)] pt-4">
        <Button type="submit" variant="primary" size="md" className="flex-1 min-h-11 px-4" disabled={isSubmitting}>
          {isEdit ? "Save Changes" : "Create Task"}
        </Button>
        <Button type="button" variant="secondary" size="md" className="min-h-11 px-5" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

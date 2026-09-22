# Review Layer: Acceptance Auditor

You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

---

## Story 1.6 Specification

```markdown
# Story 1.6: Single Stream Home Layout — Today & Backlog Sections

Status: review

## Story

As a user,
I want one continuous list with a Today section and a Backlog section instead of separate capture/stats/queue panels,
so that the app matches how I actually think about my tasks — one ranked stack.

## Acceptance Criteria

1. **Given** the home page, **when** it renders, **then** it shows (top to bottom): `QuickAddBar`, Today section (tasks with status `next`/`in-progress`, or due today/overdue), `SectionDivider`, Backlog section (remaining active tasks with status `backlog`), **and** this replaces the current quick-capture panel, stats grid, and flat queue. [Source: epics.md#Story 1.6]
2. **Given** Today tasks, **when** displayed, **then** they follow the existing "recommended" sort (pinned first, then `priorityScore` descending). [Source: epics.md#Story 1.6]
3. **Given** Backlog tasks, **when** displayed, **then** they use the same `TaskRow` and ordering logic, at `.88` opacity. [Source: epics.md#Story 1.6]
4. **Given** zero Today tasks, **when** displayed, **then** the Today `EmptyState` shows instead of an empty gap. [Source: epics.md#Story 1.6]
5. **Given** a task is added via `QuickAddBar`, **when** created, **then** its status defaults to `"next"` (Today) rather than `"backlog"`, matching the UX spec's Add flow. [Source: epics.md#Story 1.6]

## Tasks / Subtasks

- Task 1: Add Today/Backlog section hooks to `hooks/useTasks.ts` (AC: #2, #3)
  - Extract `isTodayTask(task: Task): boolean` from `useTodayTasks`
  - Add `useTodaySectionTasks()` and `useBacklogSectionTasks()`, built on top of `useSortedTasks()`
- Task 2: Add Backlog-opacity pass-through and a stable `DndContext` id to `DraggableTaskList` (AC: #3)
  - Add `isBacklog?: boolean` to `DraggableTaskListProps` and thread to `TaskRow`
  - Note: cross-section drag is explicitly out of scope for Story 1.6 (that is Story 1.7)
- Task 3: Rebuild `app/page.tsx` as the Single Stream layout (AC: #1, #4, #5)
  - Remove hero header, stats grid, old queue wrapper
  - Render QuickAddBar -> Today section / EmptyState -> SectionDivider -> Backlog section / EmptyState
  - `handleQuickAdd`: creates task with `status: "next"`
- Task 4: Manual verification (all ACs)
- Task 5: Playwright E2E coverage (`tests/e2e/single-stream-layout.spec.ts`)
```

---

## Project Context Rules

```markdown
- Technology Stack: Next.js 15.3.4 (App Router), React 19.0.0, TypeScript strict, Zustand 5.0.5, Tailwind CSS v4, Lucide React
- Strict Typing: Strict TypeScript enabled. Never use any; use explicit domain interfaces from @/types.
- Path Aliases: Always use @/* for internal project imports.
- Client Component Boundaries: Explicitly tag interactive components using "use client"; at the top of the file.
- State & Score Recalculation: Task additions, updates, priority changes in useTaskStore must preserve consistency.
- Forms: Zod validation schemas separated from pure presentational components.
- Anti-patterns: Do not mutate task state directly; do not use inline styling.
```

---

## Diff Under Review

```diff
diff --git a/app/page.tsx b/app/page.tsx
index d280746..0f2da6d 100644
--- a/app/page.tsx
+++ b/app/page.tsx
@@ -1,151 +1,139 @@
 "use client";
 
 import { useState } from "react";
+import {
+  DndContext,
+  closestCenter,
+  KeyboardSensor,
+  PointerSensor,
+  useSensor,
+  useSensors,
+  DragEndEvent,
+} from "@dnd-kit/core";
+import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
 import { useTaskStore } from "@/stores/task-store";
-import { useStats } from "@/hooks/useTasks";
-import { DraggableTaskList } from "@/components/tasks/DraggableTaskList";
+import { useTodaySectionTasks, useBacklogSectionTasks } from "@/hooks/useTasks";
+import { DraggableTaskList, SectionDropZone } from "@/components/tasks/DraggableTaskList";
+import { QuickAddBar } from "@/components/tasks/QuickAddBar";
+import { SectionDivider } from "@/components/ui/SectionDivider";
+import { EmptyState } from "@/components/ui/EmptyState";
 import { TaskDrawer } from "@/components/tasks/TaskDrawer";
-import { Task, TaskPriority } from "@/types";
-import { AlertTriangle, ArrowUpDown, CheckCircle2, ChevronDown, ChevronUp, Clock3, ListTodo, Plus, Sparkles, Timer } from "lucide-react";
-
-const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
-  { value: "critical", label: "Critical", color: "#fb7185" },
-  { value: "high", label: "High", color: "#fb923c" },
-  { value: "medium", label: "Medium", color: "#facc15" },
-  { value: "low", label: "Low", color: "#4ade80" },
-];
+import { Task } from "@/types";
 
 export default function HomePage() {
-  const { tasks, addTask } = useTaskStore();
-  const stats = useStats();
-  const [title, setTitle] = useState("");
-  const [description, setDescription] = useState("");
-  const [priority, setPriority] = useState<TaskPriority>("medium");
-  const [showDetails, setShowDetails] = useState(false);
+  const { addTask, settings, reorderTasks, setSortMode, moveTask } = useTaskStore();
+  const todayTasks = useTodaySectionTasks();
+  const backlogTasks = useBacklogSectionTasks();
   const [editTask, setEditTask] = useState<Task | undefined>();
   const [drawerOpen, setDrawerOpen] = useState(false);
 
-  const activeTasks = tasks.filter((t) => t.status !== "completed").sort((a, b) => a.position - b.position);
+  const sensors = useSensors(
+    useSensor(PointerSensor, {
+      activationConstraint: {
+        distance: 4, // 4px movement before drag activates, prevents accidental clicks
+      },
+    }),
+    useSensor(KeyboardSensor, {
+      coordinateGetter: sortableKeyboardCoordinates,
+    })
+  );
 
-  function handleCreate(e: React.FormEvent) {
-    e.preventDefault();
-    const cleanTitle = title.trim();
-    if (!cleanTitle) return;
+  function sectionOf(id: string): "today" | "backlog" | null {
+    if (todayTasks.some((t) => t.id === id)) return "today";
+    if (backlogTasks.some((t) => t.id === id)) return "backlog";
+    return null;
+  }
+
+  function handleDragEnd(event: DragEndEvent) {
+    const { active, over } = event;
+    if (!over) return;
+
+    const activeId = String(active.id);
+    const overId = String(over.id);
+    if (activeId === overId) return;
+
+    const sourceSection = sectionOf(activeId);
+    if (!sourceSection) return;
+
+    const destSection =
+      overId === "today-dropzone" ? "today" :
+      overId === "backlog-dropzone" ? "backlog" :
+      sectionOf(overId);
+    if (!destSection) return;
+
+    setSortMode("manual");
+
+    if (destSection === sourceSection) {
+      // Same-section drag: position only, no status change
+      const list = sourceSection === "today" ? todayTasks : backlogTasks;
+      const oldIndex = list.findIndex((t) => t.id === activeId);
+      const newIndex = list.findIndex((t) => t.id === overId);
+      if (oldIndex < 0 || newIndex < 0) return;
+      reorderTasks(arrayMove(list, oldIndex, newIndex).map((t) => t.id));
+    } else {
+      // Cross-section drag: atomic status+position via moveTask
+      const destList = destSection === "today" ? todayTasks : backlogTasks;
+      const destIds = destList.map((t) => t.id);
+      const insertAt = destIds.indexOf(overId);
+      if (insertAt >= 0) destIds.splice(insertAt, 0, activeId);
+      else destIds.push(activeId); // dropped on the empty-section dropzone
+      moveTask(activeId, destSection === "today" ? "next" : "backlog", destIds);
+    }
+  }
 
+  function handleQuickAdd(title: string) {
+    const priority = settings.defaultPriority;
     const score = priority === "critical" ? 9 : priority === "high" ? 7 : priority === "medium" ? 5 : 3;
     addTask({
-      title: cleanTitle,
-      description: description.trim() || undefined,
+      title,
       priority,
-      status: "backlog",
+      status: "next",
       importance: score,
       urgency: score,
       tags: [],
       dependencies: [],
       isPinned: false,
     });
-    setTitle("");
-    setDescription("");
-    setShowDetails(false);
+  }
+
+  function handleEdit(task: Task) {
+    setEditTask(task);
+    setDrawerOpen(true);
   }
 
   return (
-    <div className="space-y-7 lg:space-y-9">
-      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
-        <div>
-          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-amber-400">
-            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Good morning
-          </p>
-          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Make room for focused work.</h1>
-          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">Capture what is on your mind, then let your priority queue guide the next right thing.</p>
-        </div>
-        <div className="flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-zinc-400">
-          <ListTodo size={15} className="text-amber-400" /> {activeTasks.length} active {activeTasks.length === 1 ? "task" : "tasks"}
-        </div>
-      </section>
-
-      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
-        <div className="surface-panel overflow-hidden p-5 sm:p-6">
-          <div className="mb-5 flex items-start justify-between gap-4">
-            <div>
-              <div className="mb-2 flex items-center gap-2 text-amber-300"><Sparkles size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.15em]">Quick capture</span></div>
-              <h2 className="text-lg font-semibold tracking-tight text-white">What needs your attention?</h2>
-            </div>
-            <span className="hidden rounded-lg bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:block">New task</span>
-          </div>
-
-          <form onSubmit={handleCreate} className="space-y-4">
-            <div className="flex flex-col gap-2 sm:flex-row">
-              <input
-                type="text"
-                value={title}
-                onChange={(e) => setTitle(e.target.value)}
-                placeholder="e.g. Prepare the project brief"
-                className="field-control min-w-0 flex-1 px-4 py-3 text-sm"
-              />
-              <button type="submit" disabled={!title.trim()} className="primary-button shrink-0 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40">
-                <Plus size={17} strokeWidth={2.5} /> Add task
-              </button>
-            </div>
-
-            <div>
-              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">Priority</label>
-              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
-                {PRIORITY_OPTIONS.map((option) => {
-                  const selected = priority === option.value;
-                  return (
-                    <button key={option.value} type="button" onClick={() => setPriority(option.value)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${selected ? "border-white/[0.18] bg-white/[0.1] text-white" : "border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300"}`}>
-                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color, boxShadow: selected ? `0 0 0 3px ${option.color}22` : undefined }} />
-                      {option.label}
-                    </button>
-                  );
-                })}
-              </div>
-            </div>
-
-            {showDetails && <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add context or a definition of done..." rows={3} className="field-control resize-none px-4 py-3 text-sm" />}
-            <button type="button" onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200">
-              {showDetails ? "Hide details" : "Add details"}{showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
-            </button>
-          </form>
-        </div>
-
-        <div className="surface-panel p-5 sm:p-6">
-          <div className="mb-5 flex items-center justify-between">
-            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">At a glance</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Your momentum</h2></div>
-            <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-400"><CheckCircle2 size={18} /></div>
-          </div>
-          <div className="grid grid-cols-2 gap-3">
-            <Stat label="In progress" value={tasks.filter((task) => task.status === "in-progress").length} icon={<Timer size={14} />} tone="amber" />
-            <Stat label="Completed today" value={stats.completedToday} icon={<CheckCircle2 size={14} />} tone="green" />
-            <Stat label="Overdue" value={stats.overdue} icon={<AlertTriangle size={14} />} tone="rose" />
-            <Stat label="Time remaining" value={stats.estimatedRemaining ? `${stats.estimatedRemaining}m` : "ΓÇö"} icon={<Clock3 size={14} />} tone="blue" />
-          </div>
-        </div>
-      </section>
-
-      <section className="surface-panel p-4 sm:p-6">
-        <div className="mb-5 flex flex-col gap-3 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
-          <div>
-            <div className="flex items-center gap-2"><h2 className="text-lg font-semibold tracking-tight text-white">Your queue</h2><span className="rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[11px] font-semibold text-zinc-400">{activeTasks.length}</span></div>
-            <p className="mt-1 text-xs text-zinc-600">Drag tasks into the order you want to work through them.</p>
-          </div>
-          {activeTasks.length > 1 && <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600"><ArrowUpDown size={13} /> Drag to reorder</span>}
-        </div>
-
-        {activeTasks.length === 0 ? (
-          <div className="empty-state py-16"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300"><ListTodo size={23} /></div><h3 className="text-sm font-semibold text-zinc-200">Your queue is clear</h3><p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-600">Add a task above and it will appear here, ready for its next move.</p></div>
-        ) : (
-          <DraggableTaskList tasks={activeTasks} onEdit={(task) => { setEditTask(task); setDrawerOpen(true); }} />
-        )}
-      </section>
+    <div className="space-y-6">
+      <QuickAddBar onAdd={handleQuickAdd} />
+
+      <DndContext
+        sensors={sensors}
+        collisionDetection={closestCenter}
+        onDragEnd={handleDragEnd}
+      >
+        <section>
+          {todayTasks.length === 0 ? (
+            <SectionDropZone id="today-dropzone">
+              <EmptyState title="Nothing here yet" />
+            </SectionDropZone>
+          ) : (
+            <DraggableTaskList tasks={todayTasks} onEdit={handleEdit} />
+          )}
+        </section>
+
+        <SectionDivider label="BACKLOG" />
+
+        <section>
+          {backlogTasks.length === 0 ? (
+            <SectionDropZone id="backlog-dropzone">
+              <EmptyState title="Backlog is clear" />
+            </SectionDropZone>
+          ) : (
+            <DraggableTaskList tasks={backlogTasks} isBacklog onEdit={handleEdit} />
+          )}
+        </section>
+      </DndContext>
 
       <TaskDrawer open={drawerOpen} task={editTask} onClose={() => { setDrawerOpen(false); setEditTask(undefined); }} />
     </div>
   );
 }
diff --git a/components/tasks/DraggableTaskList.tsx b/components/tasks/DraggableTaskList.tsx
index 4609371..2e52e9a 100644
--- a/components/tasks/DraggableTaskList.tsx
+++ b/components/tasks/DraggableTaskList.tsx
@@ -1,33 +1,23 @@
 "use client";
 
-import {
-  DndContext,
-  closestCenter,
-  KeyboardSensor,
-  PointerSensor,
-  useSensor,
-  useSensors,
-  DragEndEvent,
-} from "@dnd-kit/core";
+import { ReactNode } from "react";
+import { useDroppable } from "@dnd-kit/core";
 import {
   SortableContext,
-  sortableKeyboardCoordinates,
   verticalListSortingStrategy,
   useSortable,
-  arrayMove,
 } from "@dnd-kit/sortable";
 import { CSS } from "@dnd-kit/utilities";
 import { Task } from "@/types";
-import { useTaskStore } from "@/stores/task-store";
-import { TaskCard } from "./TaskCard";
+import { TaskRow } from "./TaskRow";
 
-function SortableTaskCard({
+function SortableTaskRow({
   task,
-  index,
+  isBacklog,
   onEdit,
 }: {
   task: Task;
-  index: number;
+  isBacklog?: boolean;
   onEdit: (task: Task) => void;
 }) {
   const {
@@ -49,11 +39,11 @@ function SortableTaskCard({
       }}
       className="w-full relative"
     >
-      <TaskCard
+      <TaskRow
         task={task}
-        index={index}
         dragHandleProps={{ ...attributes, ...listeners }}
         isDragging={isDragging}
+        isBacklog={isBacklog}
         onEdit={onEdit}
       />
     </div>
@@ -62,59 +52,31 @@ function SortableTaskCard({
 
 interface DraggableTaskListProps {
   tasks: Task[];
+  isBacklog?: boolean;
   onEdit: (task: Task) => void;
 }
 
-export function DraggableTaskList({ tasks, onEdit }: DraggableTaskListProps) {
-  const { reorderTasks, setSortMode } = useTaskStore();
-
-  const sensors = useSensors(
-    useSensor(PointerSensor, {
-      activationConstraint: {
-        distance: 4, // 4px movement before drag activates, prevents accidental clicks
-      },
-    }),
-    useSensor(KeyboardSensor, {
-      coordinateGetter: sortableKeyboardCoordinates,
-    })
-  );
-
-  function handleDragEnd(event: DragEndEvent) {
-    const { active, over } = event;
-    if (!over || active.id === over.id) return;
-
-    const oldIndex = tasks.findIndex((t) => t.id === active.id);
-    const newIndex = tasks.findIndex((t) => t.id === over.id);
-    if (oldIndex < 0 || newIndex < 0) return;
-
-    const reordered = arrayMove(tasks, oldIndex, newIndex);
-
-    // Save manual drag-and-drop order
-    setSortMode("manual");
-    reorderTasks(reordered.map((t) => t.id));
-  }
-
+export function DraggableTaskList({ tasks, isBacklog, onEdit }: DraggableTaskListProps) {
   return (
-    <DndContext
-      sensors={sensors}
-      collisionDetection={closestCenter}
-      onDragEnd={handleDragEnd}
+    <SortableContext
+      items={tasks.map((t) => t.id)}
+      strategy={verticalListSortingStrategy}
     >
-      <SortableContext
-        items={tasks.map((t) => t.id)}
-        strategy={verticalListSortingStrategy}
-      >
-        <div className="flex flex-col gap-4 py-1">
-          {tasks.map((task, index) => (
-            <SortableTaskCard
-              key={task.id}
-              task={task}
-              index={index}
-              onEdit={onEdit}
-            />
-          ))}
-        </div>
-      </SortableContext>
-    </DndContext>
+      <div className="flex flex-col gap-4 py-1">
+        {tasks.map((task) => (
+          <SortableTaskRow
+            key={task.id}
+            task={task}
+            isBacklog={isBacklog}
+            onEdit={onEdit}
+          />
+        ))}
+      </div>
+    </SortableContext>
   );
 }
+
+export function SectionDropZone({ id, children }: { id: string; children: ReactNode }) {
+  const { setNodeRef } = useDroppable({ id });
+  return <div ref={setNodeRef}>{children}</div>;
+}
diff --git a/hooks/useTasks.ts b/hooks/useTasks.ts
index b8d3a7e..8f49bbd 100644
--- a/hooks/useTasks.ts
+++ b/hooks/useTasks.ts
@@ -30,24 +30,34 @@ export function useRecommendedTasks() {
   }, [tasks]);
 }
 
+export function isTodayTask(task: Task): boolean {
+  if (task.status === "completed") return false;
+  if (task.status === "in-progress") return true;
+  if (task.status === "next") return true;
+  if (task.dueDate) {
+    try {
+      const d = parseISO(task.dueDate);
+      if (isValid(d) && (isToday(d) || isPast(d))) return true;
+    } catch {
+      //
+    }
+  }
+  return false;
+}
+
 export function useTodayTasks() {
   const tasks = useTaskStore((s) => s.tasks);
-  return useMemo(() => {
-    return tasks.filter((t) => {
-      if (t.status === "completed") return false;
-      if (t.status === "in-progress") return true;
-      if (t.status === "next") return true;
-      if (t.dueDate) {
-        try {
-          const d = parseISO(t.dueDate);
-          if (isValid(d) && (isToday(d) || isPast(d))) return true;
-        } catch {
-          //
-        }
-      }
-      return false;
-    });
-  }, [tasks]);
+  return useMemo(() => tasks.filter(isTodayTask), [tasks]);
+}
+
+export function useTodaySectionTasks() {
+  const activeTasks = useSortedTasks();
+  return useMemo(() => activeTasks.filter(isTodayTask), [activeTasks]);
+}
+
 export function useBacklogSectionTasks() {
   const activeTasks = useSortedTasks();
   return useMemo(() => activeTasks.filter((t) => !isTodayTask(t)), [activeTasks]);
 }
 
 export function useCompletedTasks() {
diff --git a/tests/e2e/single-stream-layout.spec.ts b/tests/e2e/single-stream-layout.spec.ts
new file mode 100644
index 0000000..540fa44
--- /dev/null
+++ b/tests/e2e/single-stream-layout.spec.ts
@@ -0,0 +1,108 @@
+import { test, expect } from '../support/merged-fixtures';
+
+// Coverage for Story 1.6 (Single Stream Home Layout — Today & Backlog sections).
+// Test IDs follow the Epic 1 test-design doc's P0/P1/P2 breakdown for Story 1.6.
+test.describe('Single Stream home layout', () => {
+  test('1.6-E2E-001 (P0): renders QuickAddBar, Today, SectionDivider, Backlog in order', async ({ page }) => {
+    await page.goto('/');
+
+    await expect(page.getByLabel('Add a task')).toBeVisible();
+    await expect(page.getByText('Nothing here yet')).toBeVisible();
+    const divider = page.getByText('BACKLOG', { exact: true });
+    await expect(divider).toBeVisible();
+    await expect(page.getByText('Backlog is clear')).toBeVisible();
+
+    const quickAddY = (await page.getByLabel('Add a task').boundingBox())!.y;
+    const todayEmptyY = (await page.getByText('Nothing here yet').boundingBox())!.y;
+    const dividerY = (await divider.boundingBox())!.y;
+    const backlogEmptyY = (await page.getByText('Backlog is clear').boundingBox())!.y;
+
+    expect(quickAddY).toBeLessThan(todayEmptyY);
+    expect(todayEmptyY).toBeLessThan(dividerY);
+    expect(dividerY).toBeLessThan(backlogEmptyY);
+  });
+
+  test('1.6-E2E-002 (P1): a quick-added task defaults into the Today section, not Backlog', async ({ page }) => {
+    await page.goto('/');
+    const input = page.getByLabel('Add a task');
+
+    await input.fill('New task');
+    await input.press('Enter');
+
+    await expect(page.getByText('New task')).toBeVisible();
+    await expect(page.getByText('Nothing here yet')).not.toBeVisible();
+    await expect(page.getByText('Backlog is clear')).toBeVisible();
+
+    const taskY = (await page.getByText('New task').boundingBox())!.y;
+    const dividerY = (await page.getByText('BACKLOG', { exact: true }).boundingBox())!.y;
+    expect(taskY).toBeLessThan(dividerY);
+  });
+
+  test('1.6-E2E-003 (P1): Today section follows the recommended (score-descending) sort', async ({ page }) => {
+    await page.goto('/');
+    const input = page.getByLabel('Add a task');
+    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
+
+    await input.fill('Low prio task');
+    await input.press('Enter');
+    await expect(page.getByText('Low prio task')).toBeVisible();
+
+    await rows.filter({ hasText: 'Low prio task' }).getByLabel('Edit task').click();
+    await page.locator('select').first().selectOption('low');
+    // Work around a pre-existing, unrelated TaskForm bug (see Story 1.4's Dev Agent Record):
+    // an empty "Est. Minutes" field becomes NaN via valueAsNumber, silently blocking save.
+    await page.getByPlaceholder('e.g. 45').fill('30');
+    await page.getByRole('button', { name: /save changes/i }).click();
+    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();
+
+    await input.fill('High prio task');
+    await input.press('Enter');
+    await expect(page.getByText('High prio task')).toBeVisible();
+
+    const rowTexts = await rows.allTextContents();
+    const lowIdx = rowTexts.findIndex((t) => t.includes('Low prio task'));
+    const highIdx = rowTexts.findIndex((t) => t.includes('High prio task'));
+    expect(highIdx).toBeGreaterThanOrEqual(0);
+    expect(lowIdx).toBeGreaterThanOrEqual(0);
+    expect(highIdx).toBeLessThan(lowIdx);
+  });
+
+  test('1.6-E2E-004 (P2): a task moved to Backlog renders at .88 opacity', async ({ page }) => {
+    await page.goto('/');
+    const input = page.getByLabel('Add a task');
+    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
+
+    await input.fill('Task to demote');
+    await input.press('Enter');
+    await expect(page.getByText('Task to demote')).toBeVisible();
+
+    await rows.filter({ hasText: 'Task to demote' }).getByLabel('Edit task').click();
+    await page.locator('select').nth(1).selectOption('backlog');
+    await page.getByPlaceholder('e.g. 45').fill('30');
+    await page.getByRole('button', { name: /save changes/i }).click();
+    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();
+
+    const backlogRow = rows.filter({ hasText: 'Task to demote' });
+    await expect(backlogRow).toHaveClass(/opacity-\[0\.88\]/);
+    await expect(backlogRow).toHaveCSS('opacity', '0.88');
+  });
+
+  test('1.6-E2E-005 (P2): Today empty-state shows when only Backlog has tasks', async ({ page }) => {
+    await page.goto('/');
+    const input = page.getByLabel('Add a task');
+    const rows = page.locator('div.group', { has: page.getByLabel('Reorder task') });
+
+    await input.fill('Only backlog task');
+    await input.press('Enter');
+    await expect(page.getByText('Only backlog task')).toBeVisible();
+
+    await rows.filter({ hasText: 'Only backlog task' }).getByLabel('Edit task').click();
+    await page.locator('select').nth(1).selectOption('backlog');
+    await page.getByPlaceholder('e.g. 45').fill('30');
+    await page.getByRole('button', { name: /save changes/i }).click();
+    await expect(page.getByRole('heading', { name: 'Edit Task' })).not.toBeVisible();
+
+    await expect(page.getByText('Nothing here yet')).toBeVisible();
+    await expect(page.getByText('Backlog is clear')).not.toBeVisible();
+  });
+});
```

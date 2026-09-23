"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuickAddBarProps {
  onAdd: (title: string) => void;
}

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd(input);
    setInput("");
  }

  // Escape clears the draft but keeps focus for the next capture (UX-DR6).
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape" && input) {
      e.preventDefault();
      setInput("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Add a task"
        placeholder="Add a task..."
        className="field-control min-h-11 flex-1 px-4 py-2.5"
      />
      <Button type="submit" variant="primary" size="md" aria-label="Add task" className="min-h-11 px-5">
        <Plus size={18} />
        Add
      </Button>
    </form>
  );
}

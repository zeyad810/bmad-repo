"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a task..."
        className="field-control flex-1 px-4 py-3"
      />
      <button
        type="submit"
        className="primary-button px-4 py-3"
      >
        <Plus size={18} />
        Add
      </button>
    </form>
  );
}

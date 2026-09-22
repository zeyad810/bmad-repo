"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/stores/task-store";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useTaskStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

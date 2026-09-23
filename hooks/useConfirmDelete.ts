"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useConfirmDelete(onConfirm: () => void, timeoutMs = 2500) {
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
    setConfirming(false);
  }, []);

  const handleTrigger = useCallback(() => {
    if (confirming) {
      cancel();
      onConfirm();
      return;
    }
    setConfirming(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      setConfirming(false);
    }, timeoutMs);
  }, [confirming, cancel, onConfirm, timeoutMs]);

  // Attached only while confirming, and only after the render this state
  // change causes — so the pointerdown that opened the confirm state (which
  // already fired before this effect runs) can never immediately cancel it.
  useEffect(() => {
    if (!confirming) return;
    function handlePointerDown(e: PointerEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        cancel();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [confirming, cancel]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { confirming, triggerRef, handleTrigger };
}

"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Remember what had focus when the dialog opens. Captured during the opening
  // render, because TaskForm's autoFocus moves focus before any effect runs.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  if (open && !wasOpenRef.current && typeof document !== "undefined") {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  wasOpenRef.current = open;

  // Keyed on `open` only (onClose is a fresh closure each render).
  useEffect(() => {
    if (!open) return;
    return () => {
      const previous = returnFocusRef.current;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  // Modal focus trap: Tab / Shift+Tab cycle inside the panel.
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !ref.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
      />

      {/* Responsive Sheet (Bottom sheet on mobile, slide-over on tablet/desktop) */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="fixed z-50 bg-[var(--surface)] border-[var(--border)] flex flex-col overflow-hidden shadow-xl transition-all
          inset-x-0 bottom-0 max-h-[90vh] rounded-t-xl border-t
          md:inset-y-0 md:right-0 md:left-auto md:w-120 md:max-w-full md:max-h-full md:rounded-none md:border-l md:border-t-0"
      >
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
          <h2 id={titleId} className="text-subhead font-semibold text-[var(--text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-full transition-colors md:h-9 md:w-9"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </>
  );
}

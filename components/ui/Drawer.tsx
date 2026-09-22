"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

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
        className="fixed z-50 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden shadow-2xl transition-all
          inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl border-t
          md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:max-h-full md:rounded-none md:border-l md:border-t-0"
      >
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-base font-bold text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </>
  );
}

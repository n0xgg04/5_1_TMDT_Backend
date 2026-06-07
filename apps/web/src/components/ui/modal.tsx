"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative max-h-[92vh] w-full overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-white/20 animate-fade-in",
          sizes[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-ink-950">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-800"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

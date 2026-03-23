"use client";

import { AlertTriangle } from "lucide-react";

import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onClose,
}: ConfirmationDialogProps) {
  const dialogRef = useDialogFocusTrap({ open, onClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        tabIndex={-1}
        className="relative w-full max-w-md border border-border bg-surface shadow-none outline-none"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="confirmation-dialog-title"
              className="text-base font-display font-medium text-foreground"
            >
              {title}
            </h2>
            <p
              id="confirmation-dialog-description"
              className="mt-1 text-sm leading-relaxed text-muted"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted transition-all duration-150 hover:bg-surface-hover hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-display font-medium transition-all duration-150 ${
              tone === "danger"
                ? "border border-foreground bg-foreground text-background hover:opacity-90"
                : "border border-foreground bg-foreground text-background hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

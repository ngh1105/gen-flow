"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Monitor } from "lucide-react";
import Link from "next/link";

import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { useFlowStore } from "@/store/useFlowStore";

export default function ResponsiveWarning() {
  const [tooSmall, setTooSmall] = useState(false);
  const lastDraftSavedAt = useFlowStore((state) => state.lastDraftSavedAt);
  const dialogRef = useDialogFocusTrap({ open: tooSmall });

  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!tooSmall) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsupported-viewport-title"
        aria-describedby="unsupported-viewport-description"
        tabIndex={-1}
        data-testid="unsupported-viewport-dialog"
        className="w-full max-w-md border border-border bg-surface px-6 py-6 text-center outline-none"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-none bg-foreground">
          <Monitor className="h-8 w-8 text-background" />
        </div>

        <h2 id="unsupported-viewport-title" className="mb-2 text-xl font-bold">
          Builder Editing Stays Desktop-Only
        </h2>
        <p
          id="unsupported-viewport-description"
          className="mb-4 text-sm leading-relaxed text-muted"
        >
          GenFlow currently supports editing on screens at least{" "}
          <strong className="text-foreground">1024px</strong> wide. Reopen the
          builder on a larger screen to keep working.
        </p>

        <div className="mb-5 border border-border bg-background px-3 py-2 text-left">
          <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
            Draft Safety
          </p>
          <p className="mt-1 text-xs text-muted">
            Your current browser draft will restore on desktop
            {lastDraftSavedAt
              ? `, last autosaved at ${new Date(lastDraftSavedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}.`
              : "."}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-none bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors duration-150 hover:bg-foreground hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Home
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center justify-center gap-2 rounded-none border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:border-foreground hover:bg-surface-hover"
          >
            <BookOpen className="h-4 w-4" />
            Learn First
          </Link>
        </div>
      </div>
    </div>
  );
}

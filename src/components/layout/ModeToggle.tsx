"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Code2, LayoutPanelLeft, Wrench } from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";

export default function ModeToggle() {
  const [open, setOpen] = useState(false);
  const editorMode = useFlowStore((s) => s.editorMode);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const builderSurface = useFlowStore((s) => s.builderSurface);
  const setEditorMode = useFlowStore((s) => s.setEditorMode);
  const setBuilderSurface = useFlowStore((s) => s.setBuilderSurface);
  const canShowGuidedSurface = activeTemplateId !== "custom-compose";

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="advanced-tools-trigger"
        className="flex items-center gap-1.5 rounded-none border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted transition-all duration-150 hover:border-foreground hover:text-foreground"
      >
        <Wrench className="h-3.5 w-3.5" />
        Advanced
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-[260px] border border-border bg-surface shadow-none"
            data-testid="advanced-tools-menu"
          >
            <div className="border-b border-border px-3 py-3 bg-background/70">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                Advanced Tools
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Most users can stay in guided setup. Open developer tools only when you need to inspect the template canvas or manually edit Python.
              </p>
            </div>

            <div className="p-2">
              {canShowGuidedSurface && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorMode("visual");
                    setBuilderSurface("guided");
                    setOpen(false);
                  }}
                  data-testid="mode-toggle-visual"
                  aria-label="Switch to guided builder mode"
                  className={`w-full rounded-none border px-3 py-2 text-left transition-all duration-150 ${
                    editorMode === "visual" && builderSurface === "guided"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <p className="text-xs font-medium">Guided Builder</p>
                  <p
                    className={`mt-1 text-[11px] leading-relaxed ${
                      editorMode === "visual" && builderSurface === "guided"
                        ? "text-background/75"
                        : "text-muted"
                    }`}
                  >
                    Choose a contract type, answer the setup questions, preview, and export.
                  </p>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditorMode("visual");
                  setBuilderSurface("advanced");
                  setOpen(false);
                }}
                data-testid="mode-toggle-advanced-visual"
                aria-label="Open advanced developer tools"
                className={`${
                  canShowGuidedSurface ? "mt-2 " : ""
                }w-full rounded-none border px-3 py-2 text-left transition-all duration-150 ${
                  editorMode === "visual" && builderSurface === "advanced"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutPanelLeft className="h-3.5 w-3.5" />
                  <p className="text-xs font-medium">
                    {activeTemplateId === "custom-compose"
                      ? "Advanced Compose"
                      : "Developer Tools"}
                  </p>
                </div>
                <p
                  className={`mt-1 text-[11px] leading-relaxed ${
                    editorMode === "visual" && builderSurface === "advanced"
                      ? "text-background/75"
                      : "text-muted"
                  }`}
                >
                  {activeTemplateId === "custom-compose"
                    ? "Block-by-block canvas control for technical users."
                    : "Inspect the template canvas and generated output without leaving your guided draft."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditorMode("code");
                  setOpen(false);
                }}
                data-testid="mode-toggle-code"
                aria-label="Switch to advanced code editor mode"
                className={`mt-2 w-full rounded-none border px-3 py-2 text-left transition-all duration-150 ${
                  editorMode === "code"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5" />
                  <p className="text-xs font-medium">Advanced Code</p>
                </div>
                <p
                  className={`mt-1 text-[11px] leading-relaxed ${
                    editorMode === "code" ? "text-background/75" : "text-muted"
                  }`}
                >
                  Manually refine the generated Python. This mode is intended for technical users.
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

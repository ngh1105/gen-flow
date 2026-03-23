"use client";

import { Blocks, Github } from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";
import TemplateSwitcher from "./TemplateSwitcher";
import ModeToggle from "./ModeToggle";

export default function Header() {
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const editorMode = useFlowStore((s) => s.editorMode);
  const hasUnsavedChanges = useFlowStore((s) => s.hasUnsavedChanges);
  const lastNamedSaveAt = useFlowStore((s) => s.lastNamedSaveAt);

  const modeLabel =
    editorMode === "code"
      ? "Code Mode"
      : activeTemplateId === "custom-compose"
        ? "Custom Compose"
        : "Template Mode";

  const modeHint =
    editorMode === "code"
      ? "Manual edits override generated code until reset."
      : activeTemplateId === "custom-compose"
        ? "Drag or click Add to build block by block."
        : "Layout is locked; logic comes from the selected template.";

  const draftLabel = hasUnsavedChanges
    ? "Unsaved"
    : lastNamedSaveAt
      ? "Saved"
      : "Draft";

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface/80 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-none bg-foreground">
          <Blocks className="w-5 h-5 text-background" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold tracking-tight leading-none">
            Gen<span className="text-foreground">Flow</span>
          </h1>
          <p className="text-[11px] text-muted leading-none mt-0.5">
            Visual Builder for GenLayer
          </p>
        </div>
        <span className="ml-1 px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest rounded-none bg-foreground text-background border border-foreground">
          MVP
        </span>
        <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest rounded-none border border-border bg-background text-foreground">
          {draftLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end">
          <span className="px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest rounded-none bg-background text-foreground border border-border">
            {modeLabel}
          </span>
          <span className="mt-1 text-[10px] text-muted max-w-[220px] text-right leading-tight">
            {modeHint}
          </span>
        </div>
        <TemplateSwitcher />
        <div className="w-px h-6 bg-border" />
        <ModeToggle />
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-xs text-muted">
          Pick / Fill / Generate
        </span>
        <a
          href="https://github.com/genflow-labs/genflow"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open GenFlow GitHub repository"
          className="flex items-center justify-center w-8 h-8 rounded-none border border-border hover:border-foreground hover:bg-surface-hover transition-all duration-150"
        >
          <Github className="w-4 h-4 text-muted" />
        </a>
      </div>
    </header>
  );
}


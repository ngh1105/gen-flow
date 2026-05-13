"use client";

import { Blocks, Github } from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";
import TemplateSwitcher from "./TemplateSwitcher";
import ModeToggle from "./ModeToggle";

export default function Header() {
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const editorMode = useFlowStore((s) => s.editorMode);
  const builderSurface = useFlowStore((s) => s.builderSurface);
  const hasUnsavedChanges = useFlowStore((s) => s.hasUnsavedChanges);
  const lastNamedSaveAt = useFlowStore((s) => s.lastNamedSaveAt);

  const modeLabel =
    editorMode === "code"
      ? "Advanced Code"
      : activeTemplateId === "custom-compose"
        ? "Advanced Compose"
        : builderSurface === "advanced"
          ? "Developer Tools"
          : "Guided Setup";

  const modeHint =
    editorMode === "code"
      ? "Advanced editing for manual tweaks after the guided setup is done."
      : activeTemplateId === "custom-compose"
        ? "Advanced block-by-block mode for power users."
        : builderSurface === "advanced"
          ? "Inspect the template canvas and generated output while keeping the guided draft intact."
          : "Choose a contract type, fill the questions, preview, and export.";

  const draftLabel = hasUnsavedChanges
    ? "Unsaved"
    : lastNamedSaveAt
      ? "Saved"
      : "Draft";

  return (
    <header className="z-50 border-b border-border/80 bg-background/85 px-4 py-3 backdrop-blur-xl md:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent-blue/40 bg-accent-blue/15 shadow-[0_0_32px_rgba(56,189,248,0.18)]">
            <Blocks className="h-5 w-5 text-accent-blue" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold leading-none tracking-tight text-foreground">
                GenFlow
              </h1>
              <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest text-accent-green">
                MVP
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] text-muted">
              Premium no-code builder for GenLayer contracts
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:justify-center lg:gap-3">
          <div className="hidden xl:block max-w-[360px] rounded-2xl border border-border bg-surface/70 px-4 py-2 text-center">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-accent-blue">
              {modeLabel}
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted">{modeHint}</p>
          </div>
          <TemplateSwitcher />
          <div className="hidden min-[480px]:block">
            <ModeToggle />
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="hidden rounded-full border border-border bg-surface px-3 py-1 text-[10px] font-display font-medium uppercase tracking-widest text-muted md:inline-flex">
            {draftLabel}
          </span>
          <a
            href="https://github.com/genflow-labs/genflow"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open GenFlow GitHub repository"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface text-muted transition-all duration-150 hover:border-accent-blue/60 hover:text-accent-blue"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}


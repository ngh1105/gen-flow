"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Scale, Sparkles } from "lucide-react";

import ConfirmationDialog from "@/components/layout/ConfirmationDialog";
import { useFlowStore } from "@/store/useFlowStore";
import { getAllTemplates, type ContractTemplate } from "@/engine/templateRegistry";
import { TEMPLATE_ICON_MAP } from "@/lib/templateIcons";
import { addBuilderBreadcrumb } from "@/lib/telemetry";

function TemplateCard({
  template,
  activeTemplateId,
  onSelect,
  compact = false,
}: {
  template: ContractTemplate;
  activeTemplateId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const Icon = TEMPLATE_ICON_MAP[template.icon] || Scale;
  const isActive = template.id === activeTemplateId;

  return (
    <button
      onClick={() => onSelect(template.id)}
      data-testid={`template-option-${template.id}`}
      className={`w-full rounded-none border text-left transition-all duration-150 ${
        compact ? "p-3" : "p-4"
      } ${
        isActive
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface/50 hover:border-foreground hover:bg-surface-hover text-foreground"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-none border shrink-0 ${
            isActive
              ? "border-background/25 bg-background text-foreground"
              : "border-border bg-background text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-display font-medium leading-tight ${compact ? "text-sm" : "text-base"}`}>
              {template.name}
            </p>
            {template.featured && !compact && (
              <span
                className={`text-[9px] px-1.5 py-0.5 font-mono uppercase tracking-widest ${
                  isActive
                    ? "bg-background/15 text-background"
                    : "bg-background text-muted border border-border"
                }`}
              >
                featured
              </span>
            )}
          </div>
          <p
            className={`leading-snug ${compact ? "text-[11px]" : "text-xs"} ${
              isActive ? "text-background/80" : "text-muted"
            }`}
          >
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span
              className={`text-[9px] px-1.5 py-0.5 font-mono uppercase tracking-widest ${
                isActive
                  ? "bg-background/15 text-background"
                  : "bg-background text-muted border border-border"
              }`}
            >
              {template.category}
            </span>
            {template.tags?.slice(0, compact ? 1 : 3).map((tag) => (
              <span
                key={tag}
                className={`text-[9px] px-1.5 py-0.5 ${
                  isActive
                    ? "bg-background/10 text-background/85"
                    : "bg-border/40 text-muted"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function TemplateSwitcher() {
  const [open, setOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const hasUnsavedChanges = useFlowStore((s) => s.hasUnsavedChanges);
  const switchTemplate = useFlowStore((s) => s.switchTemplate);

  const templates = useMemo(() => getAllTemplates(), []);
  const active = templates.find((t) => t.id === activeTemplateId);
  const ActiveIcon = active ? TEMPLATE_ICON_MAP[active.icon] || Scale : Scale;

  const featuredTemplates = templates.filter((t) => t.featured);
  const customComposeTemplate = templates.find((t) => t.id === "custom-compose");
  const coreTemplates = templates.filter((t) => !t.featured && t.id !== "custom-compose");

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

  const executeSwitch = (id: string) => {
    addBuilderBreadcrumb("template_switch_confirmed", {
      templateId: id,
      hadUnsavedChanges: hasUnsavedChanges,
    });
    switchTemplate(id);
    setOpen(false);
    setPendingTemplateId(null);
  };

  const handleSelect = (id: string) => {
    if (id === activeTemplateId) {
      setOpen(false);
      return;
    }

    if (hasUnsavedChanges) {
      addBuilderBreadcrumb("template_switch_prompted", {
        templateId: id,
        activeTemplateId,
      });
      setPendingTemplateId(id);
      setOpen(false);
      return;
    }

    executeSwitch(id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="template-switcher-trigger"
        className="flex items-center gap-2 px-3 py-1.5 rounded-none border border-border hover:border-foreground bg-surface/60 hover:bg-surface-hover transition-all duration-150 text-sm"
      >
        <ActiveIcon className="w-4 h-4 text-foreground" />
        <span className="font-medium text-foreground/90 max-w-[160px] truncate">
          {active?.name || "Select Template"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-[760px] max-w-[calc(100vw-2rem)] rounded-none border border-border bg-surface shadow-none overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-background/70">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-foreground" />
                <p className="text-[11px] font-display font-medium text-muted uppercase tracking-widest">
                  Template Gallery
                </p>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Start with a featured use-case template, or switch to Custom Compose when you want
                full block-by-block control.
              </p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {featuredTemplates.length > 0 && (
                <section className="px-4 py-4 border-b border-border">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-display font-medium text-muted uppercase tracking-widest">
                        Featured Use Cases
                      </p>
                      <p className="text-[11px] text-muted mt-1">
                        Opinionated starting points for common GenLayer product flows.
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 font-mono bg-background border border-border text-muted">
                      {featuredTemplates.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {featuredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        activeTemplateId={activeTemplateId}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="px-4 py-4 space-y-4">
                {customComposeTemplate && (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-display font-medium text-muted uppercase tracking-widest">
                          Compose From Scratch
                        </p>
                        <p className="text-[11px] text-muted mt-1">
                          Blank canvas mode. Drag nodes from the sidebar to build your own flow.
                        </p>
                      </div>
                    </div>
                    <TemplateCard
                      template={customComposeTemplate}
                      activeTemplateId={activeTemplateId}
                      onSelect={handleSelect}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-display font-medium text-muted uppercase tracking-widest">
                        Core Templates
                      </p>
                      <p className="text-[11px] text-muted mt-1">
                        Simpler starting points for storage, moderation, voting, and analysis flows.
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 font-mono bg-background border border-border text-muted">
                      {coreTemplates.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {coreTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        activeTemplateId={activeTemplateId}
                        onSelect={handleSelect}
                        compact
                      />
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        open={pendingTemplateId !== null}
        title="Replace current draft?"
        description="Switching templates replaces the current canvas layout. Your in-progress draft is autosaved in this browser, but this view will be reset immediately."
        confirmLabel="Load Template"
        onClose={() => setPendingTemplateId(null)}
        onConfirm={() => {
          if (!pendingTemplateId) return;
          executeSwitch(pendingTemplateId);
        }}
      />
    </div>
  );
}

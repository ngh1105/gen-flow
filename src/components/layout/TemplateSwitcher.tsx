"use client";

import { useState } from "react";
import {
  ChevronDown,
  Scale,
  Vote,
  TrendingUp,
  Shield,
  HardDrive,
  Trophy,
  Gamepad2,
  Puzzle,
} from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";
import { getAllTemplates } from "@/engine/templateRegistry";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Scale,
  Vote,
  TrendingUp,
  Shield,
  HardDrive,
  Trophy,
  Gamepad2,
  Puzzle,
};

export default function TemplateSwitcher() {
  const [open, setOpen] = useState(false);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const switchTemplate = useFlowStore((s) => s.switchTemplate);
  const templates = getAllTemplates();
  const active = templates.find((t) => t.id === activeTemplateId);

  const handleSelect = (id: string) => {
    switchTemplate(id);
    setOpen(false);
  };

  const ActiveIcon = active ? ICON_MAP[active.icon] : Scale;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        data-testid="template-switcher-trigger"
        className="flex items-center gap-2 px-3 py-1.5 rounded-none border border-border hover:border-foreground bg-surface/60 hover:bg-surface-hover transition-all duration-150 text-sm"
      >
        {ActiveIcon && <ActiveIcon className="w-4 h-4 text-foreground" />}
        <span className="font-medium text-foreground/90 max-w-[140px] truncate">
          {active?.name || "Select Template"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 z-50 w-[280px] rounded-none border border-border bg-surface shadow-none shadow-none overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-display font-medium text-muted uppercase tracking-widest">
                Contract Templates ({templates.length})
              </p>
            </div>
            <div className="p-1.5 space-y-0.5 max-h-[400px] overflow-y-auto">
              {templates.map((t) => {
                const Icon = ICON_MAP[t.icon] || Scale;
                const isActive = t.id === activeTemplateId;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    data-testid={`template-option-${t.id}`}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-none text-left transition-all duration-150 ${
                      isActive
                        ? "bg-foreground text-background border border-foreground"
                        : "hover:bg-surface-hover border border-transparent text-foreground"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-none shrink-0 ${
                        isActive
                          ? "bg-background"
                          : "bg-border/50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-foreground" : "text-muted"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-display font-medium leading-tight ${
                          isActive ? "text-background" : "text-foreground"
                        }`}
                      >
                        {t.name}
                      </p>
                      <p className={`text-[11px] leading-snug mt-0.5 line-clamp-2 ${
                        isActive ? "text-background/80" : "text-muted"
                      }`}>
                        {t.description}
                      </p>
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-none font-mono ${
                        isActive ? "bg-background/20 text-background" : "bg-border/40 text-muted/70"
                      }`}>
                        {t.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-accent-purple/40 bg-surface/60 hover:bg-surface-hover transition-all text-sm"
      >
        {ActiveIcon && <ActiveIcon className="w-4 h-4 text-accent-purple" />}
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
          <div className="absolute top-full left-0 mt-1 z-50 w-[280px] rounded-xl border border-border bg-surface shadow-2xl shadow-black/40 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
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
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-accent-purple/10 border border-accent-purple/25"
                        : "hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        isActive
                          ? "bg-accent-purple/20"
                          : "bg-border/50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-accent-purple" : "text-muted"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          isActive ? "text-accent-purple" : "text-foreground"
                        }`}
                      >
                        {t.name}
                      </p>
                      <p className="text-[11px] text-muted leading-snug mt-0.5 line-clamp-2">
                        {t.description}
                      </p>
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-border/40 text-muted/70 font-mono">
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

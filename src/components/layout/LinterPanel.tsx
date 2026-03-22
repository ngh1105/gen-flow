"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import type { LintDiagnostic } from "@/engine/genvm-linter";

interface LinterPanelProps {
  diagnostics: LintDiagnostic[];
  onJumpToLine?: (line: number) => void;
}

const ICONS = {
  error:   <AlertCircle className="w-3 h-3 text-foreground shrink-0" />,
  warning: <AlertTriangle className="w-3 h-3 text-foreground shrink-0" />,
  info:    <Info className="w-3 h-3 text-foreground shrink-0" />,
};

const SEVERITY_ORDER: Record<LintDiagnostic["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export default function LinterPanel({ diagnostics, onJumpToLine }: LinterPanelProps) {
  const sorted = useMemo(
    () => [...diagnostics].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.line - b.line),
    [diagnostics]
  );

  // Collapse entirely when no issues — no wasted space
  if (diagnostics.length === 0) return null;

  const errors   = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.filter((d) => d.severity === "warning").length;
  const infos    = diagnostics.filter((d) => d.severity === "info").length;

  return (
    <div className="border-t border-border bg-background flex flex-col shrink-0" style={{ maxHeight: 160 }}>
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/60 shrink-0">
        <span className="text-[10px] font-display font-medium text-muted uppercase tracking-widest">
          GenVM Lint
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          {errors   > 0 && <span className="text-foreground font-bold flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" />{errors} ERROR{errors > 1 ? "S" : ""}</span>}
          {warnings > 0 && <span className="text-foreground flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />{warnings} warning{warnings > 1 ? "s" : ""}</span>}
          {infos    > 0 && <span className="text-foreground flex items-center gap-0.5"><Info className="w-2.5 h-2.5" />{infos} info</span>}
        </div>
      </div>

      {/* Diagnostics list */}
      <div className="overflow-y-auto flex-1">
        {sorted.map((d, idx) => (
          <button
            key={idx}
            onClick={() => onJumpToLine?.(d.line)}
            className="w-full flex items-start gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors duration-150 group"
          >
            {ICONS[d.severity]}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-foreground/80 leading-snug block truncate">
                {d.message}
              </span>
              <span className="text-[9px] text-muted/60">
                Line {d.line}
                {d.ruleId && <> · <code className="opacity-70">{d.ruleId}</code></>}
                {d.quickFix && <span className="text-foreground ml-1">💡 Quick fix</span>}
              </span>
            </div>
            <ChevronRight className="w-3 h-3 text-muted/40 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150 mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

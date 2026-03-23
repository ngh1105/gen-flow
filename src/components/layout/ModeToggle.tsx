"use client";

import { Layers, Code2 } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

export default function ModeToggle() {
  const editorMode = useFlowStore((s) => s.editorMode);
  const setEditorMode = useFlowStore((s) => s.setEditorMode);

  return (
    <div className="flex items-center rounded-none border border-border bg-background p-0.5">
      <button
        onClick={() => setEditorMode("visual")}
        data-testid="mode-toggle-visual"
        aria-label="Switch to visual builder mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium transition-all duration-150 ${
          editorMode === "visual"
            ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] border border-foreground shadow-sm"
            : "text-muted hover:text-foreground border border-transparent"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Visual
      </button>
      <button
        onClick={() => setEditorMode("code")}
        data-testid="mode-toggle-code"
        aria-label="Switch to code editor mode"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium transition-all duration-150 ${
          editorMode === "code"
            ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] border border-foreground shadow-sm"
            : "text-muted hover:text-foreground border border-transparent"
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
        Code
      </button>
    </div>
  );
}

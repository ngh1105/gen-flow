"use client";

import { Layers, Code2 } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

export default function ModeToggle() {
  const editorMode = useFlowStore((s) => s.editorMode);
  const setEditorMode = useFlowStore((s) => s.setEditorMode);

  return (
    <div className="flex items-center rounded-lg border border-border bg-background/60 p-0.5">
      <button
        onClick={() => setEditorMode("visual")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          editorMode === "visual"
            ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/25 shadow-sm"
            : "text-muted hover:text-foreground border border-transparent"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Visual
      </button>
      <button
        onClick={() => setEditorMode("code")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          editorMode === "code"
            ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/25 shadow-sm"
            : "text-muted hover:text-foreground border border-transparent"
        }`}
      >
        <Code2 className="w-3.5 h-3.5" />
        Code
      </button>
    </div>
  );
}

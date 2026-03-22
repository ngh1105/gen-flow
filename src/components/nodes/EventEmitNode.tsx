"use client";

import { Handle, Position } from "@xyflow/react";
import { Radio } from "lucide-react";

export default function EventEmitNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-surface border-b border-border">
        <Radio className="w-4 h-4 text-foreground" />
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-widest">
          Event Emit
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Emit on-chain events via{" "}
          <code className="text-foreground/80 text-[10px]">gl.Event</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-surface border border-border">
            <span className="text-[10px] text-foreground/70 font-mono">indexed</span>
            <span className="text-[10px] text-muted">→ positional-only params</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-surface border border-border">
            <span className="text-[10px] text-foreground/70 font-mono">.emit()</span>
            <span className="text-[10px] text-muted">→ broadcast to listeners</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

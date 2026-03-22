"use client";

import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

export default function EventNode() {
  return (
    <div className="glass-card w-[280px]">
      {/* Target Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-surface border-b border-border">
        <Zap className="w-4 h-4 text-foreground" />
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-widest">
          Event Emitter
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-2 h-2 rounded-none bg-surface" />
          <span>Emit on-chain events</span>
        </div>
        <div className="px-3 py-2 rounded-none bg-background border border-border text-xs font-mono text-foreground/70">
          <div>emit: <span className="text-foreground">state_change</span></div>
          <div>data: <span className="text-foreground">result_json</span></div>
        </div>
        <p className="text-[10px] text-muted/60 italic">
          Events trigger when contract state changes
        </p>
      </div>

      {/* Source Handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3"
      />
    </div>
  );
}

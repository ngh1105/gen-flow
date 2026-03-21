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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border-b border-yellow-500/20">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">
          Event Emitter
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
          <span>Emit on-chain events</span>
        </div>
        <div className="px-3 py-2 rounded-md bg-background/40 border border-border text-xs font-mono text-foreground/70">
          <div>emit: <span className="text-yellow-300">state_change</span></div>
          <div>data: <span className="text-yellow-300">result_json</span></div>
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

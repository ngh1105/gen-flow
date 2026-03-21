"use client";

import { Handle, Position } from "@xyflow/react";
import { ListPlus } from "lucide-react";

export default function DynArrayNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border-b border-indigo-500/20">
        <ListPlus className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
          DynArray
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Dynamic array storage via{" "}
          <code className="text-indigo-400/80 text-[10px]">DynArray[T]</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
            <span className="text-[10px] text-indigo-400/70 font-mono">.append()</span>
            <span className="text-[10px] text-muted">add item</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
            <span className="text-[10px] text-indigo-400/70 font-mono">.pop() .clear()</span>
            <span className="text-[10px] text-muted">remove</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

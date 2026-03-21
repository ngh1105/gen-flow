"use client";

import { Handle, Position } from "@xyflow/react";
import { Map } from "lucide-react";

export default function TreeMapNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-violet-600/20 to-violet-500/10 border-b border-violet-500/20">
        <Map className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
          TreeMap
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Key-value mapping via{" "}
          <code className="text-violet-400/80 text-[10px]">TreeMap[K, V]</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <span className="text-[10px] text-violet-400/70 font-mono">map[key] = val</span>
            <span className="text-[10px] text-muted">set</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
            <span className="text-[10px] text-violet-400/70 font-mono">.get(key, default)</span>
            <span className="text-[10px] text-muted">safe read</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

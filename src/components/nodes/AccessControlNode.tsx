"use client";

import { Handle, Position } from "@xyflow/react";
import { Shield } from "lucide-react";

export default function AccessControlNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/20">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
          Access Control
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Owner/admin permission checks
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <span className="text-[10px] text-emerald-400/70 font-mono">_only_owner()</span>
            <span className="text-[10px] text-muted">restrict</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <span className="text-[10px] text-emerald-400/70 font-mono">sender_address</span>
            <span className="text-[10px] text-muted">→ verify caller</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

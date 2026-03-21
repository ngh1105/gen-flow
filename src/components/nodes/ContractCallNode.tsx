"use client";

import { Handle, Position } from "@xyflow/react";
import { Link2 } from "lucide-react";

export default function ContractCallNode() {
  return (
    <div className="glass-card w-[280px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border-b border-cyan-500/20">
        <Link2 className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
          Contract Call
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Call another contract via{" "}
          <code className="text-cyan-400/80 text-[10px]">@gl.contract_interface</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <span className="text-[10px] text-cyan-400/70 font-mono">.view()</span>
            <span className="text-[10px] text-muted">→ read other contract</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <span className="text-[10px] text-cyan-400/70 font-mono">.emit()</span>
            <span className="text-[10px] text-muted">→ write to other contract</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

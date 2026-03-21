"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export default function ConsensusNode() {
  return (
    <div className="glass-card w-[280px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-lime-600/20 to-lime-500/10 border-b border-lime-500/20">
        <GitBranch className="w-4 h-4 text-lime-400" />
        <span className="text-xs font-semibold text-lime-300 uppercase tracking-wider">
          Custom Consensus
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Custom leader/validator via{" "}
          <code className="text-lime-400/80 text-[10px]">gl.vm.run_nondet</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime-500/5 border border-lime-500/10">
            <span className="text-[10px] text-lime-400/70 font-mono">leader_fn()</span>
            <span className="text-[10px] text-muted">→ execute</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lime-500/5 border border-lime-500/10">
            <span className="text-[10px] text-lime-400/70 font-mono">validator_fn()</span>
            <span className="text-[10px] text-muted">→ verify result</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

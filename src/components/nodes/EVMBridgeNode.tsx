"use client";

import { Handle, Position } from "@xyflow/react";
import { Layers } from "lucide-react";

export default function EVMBridgeNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-slate-500/20 to-slate-400/10 border-b border-slate-400/20">
        <Layers className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          EVM Bridge
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Cross-chain via{" "}
          <code className="text-slate-300/80 text-[10px]">@gl.evm.contract_interface</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/5 border border-slate-400/10">
            <span className="text-[10px] text-slate-300/70 font-mono">ERC20</span>
            <span className="text-[10px] text-muted">balanceOf, transfer</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-500/5 border border-slate-400/10">
            <span className="text-[10px] text-slate-300/70 font-mono">EVM ↔ GenLayer</span>
            <span className="text-[10px] text-muted">bridge state</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

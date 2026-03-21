"use client";

import { Handle, Position } from "@xyflow/react";
import { FileCode } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

export default function InitNode() {
  const contractName = useFlowStore((s) => s.nodeData.contractName);
  const setContractName = useFlowStore((s) => s.setContractName);
  const isEmpty = contractName.trim() === "";

  return (
    <div
      className={`glass-card w-[280px] ${isEmpty ? "node-error" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/20">
        <FileCode className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
          Init Contract
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider">
          Contract Name
        </label>
        <input
          type="text"
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          placeholder="MyArbiter"
          className="w-full px-3 py-2 text-sm bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
        />
        {isEmpty && (
          <p className="mt-1.5 text-[10px] text-accent-red flex items-center gap-1">
            ⚠ Required
          </p>
        )}
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

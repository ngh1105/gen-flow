"use client";

import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

export default function StorageNode() {
  const storageName = useFlowStore((s) => s.nodeData.storageName);
  const setStorageName = useFlowStore((s) => s.setStorageName);

  return (
    <div className="glass-card w-[280px]">
      {/* Target Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-orange-500/20">
        <Database className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
          Storage
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-2 h-2 rounded-full bg-orange-400/60" />
          <span>On-chain state variable name</span>
        </div>
        <input
          type="text"
          placeholder="e.g. data, items, records"
          value={storageName}
          onChange={(e) => setStorageName(e.target.value)}
          className="w-full px-3 py-1.5 rounded-md bg-background/60 border border-border text-xs font-mono text-foreground placeholder-muted/50 focus:outline-none focus:border-orange-500/40"
        />
        <div className="px-3 py-2 rounded-md bg-background/40 border border-border text-xs font-mono text-foreground/70">
          <div>{storageName || "data"}: <span className="text-orange-300">str</span></div>
        </div>
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

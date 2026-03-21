"use client";

import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

export default function WebFetchNode() {
  const url = useFlowStore((s) => s.nodeData.url);
  const setUrl = useFlowStore((s) => s.setUrl);
  const isEmpty = url.trim() === "";

  return (
    <div
      className={`glass-card w-[280px] ${isEmpty ? "node-error" : ""}`}
    >
      {/* Target Handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-b border-blue-500/20">
        <Globe className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
          Web Fetch
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider">
          Data Source URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/data"
          className="w-full px-3 py-2 text-sm bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all font-mono text-xs"
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

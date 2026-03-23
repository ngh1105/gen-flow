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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-surface border-b border-border">
        <Globe className="w-4 h-4 text-foreground" />
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-widest">
          Web Fetch
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-widest">
          Data Source URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/data"
          data-testid="url-input"
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-none text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground/20 transition-all duration-150 font-mono text-xs"
        />
        {isEmpty && (
          <p className="mt-1.5 text-[10px] text-foreground flex items-center gap-1">
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

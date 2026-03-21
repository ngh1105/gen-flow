"use client";

import { Handle, Position } from "@xyflow/react";
import { Send } from "lucide-react";

export default function HTTPNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-sky-600/20 to-sky-500/10 border-b border-sky-500/20">
        <Send className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
          HTTP Request
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Full HTTP via{" "}
          <code className="text-sky-400/80 text-[10px]">gl.nondet.web</code>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <span className="text-[10px] text-sky-400/70 font-mono">GET POST DELETE</span>
            <span className="text-[10px] text-muted">methods</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/5 border border-sky-500/10">
            <span className="text-[10px] text-sky-400/70 font-mono">Response</span>
            <span className="text-[10px] text-muted">status, headers, body</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

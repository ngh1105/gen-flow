"use client";

import { Handle, Position } from "@xyflow/react";
import { Coins } from "lucide-react";

export default function PayableNode() {
  return (
    <div className="glass-card w-[260px]">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-surface border-b border-border">
        <Coins className="w-4 h-4 text-foreground" />
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-widest">
          Payable
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-[11px] text-muted leading-relaxed">
          Accept native token transfers via{" "}
          <code className="text-foreground/80 text-[10px]">@gl.public.write.payable</code>
        </p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-none bg-surface border border-border">
          <span className="text-[10px] text-foreground/70 font-mono">gl.message.value</span>
          <span className="text-[10px] text-muted">→ u256</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-none bg-surface border border-border">
          <span className="text-[10px] text-foreground/70 font-mono">gl.message.sender_address</span>
          <span className="text-[10px] text-muted">→ Address</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3" />
    </div>
  );
}

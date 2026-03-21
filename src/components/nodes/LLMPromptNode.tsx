"use client";

import { Handle, Position } from "@xyflow/react";
import { Brain } from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

const VALIDATOR_OPTIONS = [1, 3, 5];

export default function LLMPromptNode() {
  const prompt = useFlowStore((s) => s.nodeData.prompt);
  const numValidators = useFlowStore((s) => s.nodeData.numValidators);
  const setPrompt = useFlowStore((s) => s.setPrompt);
  const setNumValidators = useFlowStore((s) => s.setNumValidators);
  const isEmpty = prompt.trim() === "";

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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-t-[11px] bg-gradient-to-r from-purple-600/20 to-purple-500/10 border-b border-purple-500/20">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
          LLM Prompt
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Prompt Textarea */}
        <div>
          <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-wider">
            AI Instruction
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Analyze this data and summarize the key findings..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background/60 border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all resize-none leading-relaxed"
          />
          {isEmpty && (
            <p className="mt-1 text-[10px] text-accent-red flex items-center gap-1">
              ⚠ Required
            </p>
          )}
        </div>

        {/* Validator Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-muted uppercase tracking-wider">
              Validators
            </label>
            <span className="text-xs font-mono font-bold text-accent-purple">
              {numValidators}
            </span>
          </div>
          <div className="flex gap-1.5">
            {VALIDATOR_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => setNumValidators(val)}
                className={`
                  flex-1 py-1.5 text-xs font-semibold rounded-md transition-all
                  ${
                    numValidators === val
                      ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/40 shadow-[0_0_8px_rgba(139,92,246,0.15)]"
                      : "bg-background/40 text-muted border border-border hover:border-accent-purple/20 hover:text-foreground"
                  }
                `}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

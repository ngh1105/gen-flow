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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-none bg-surface border-b border-border">
        <Brain className="w-4 h-4 text-foreground" />
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-widest">
          LLM Prompt
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Prompt Textarea */}
        <div>
          <label className="block text-[11px] text-muted mb-1.5 uppercase tracking-widest">
            AI Instruction
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Analyze this data and summarize the key findings..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-none text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground/20 transition-all duration-150 resize-none leading-relaxed"
          />
          {isEmpty && (
            <p className="mt-1 text-[10px] text-foreground flex items-center gap-1">
              ⚠ Required
            </p>
          )}
        </div>

        {/* Validator Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-muted uppercase tracking-widest">
              Validators
            </label>
            <span className="text-xs font-mono font-bold text-foreground">
              {numValidators}
            </span>
          </div>
          <div className="flex gap-1.5">
            {VALIDATOR_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => setNumValidators(val)}
                className={`
                  flex-1 py-1.5 text-xs font-display font-medium rounded-none transition-all duration-150
                  ${
                    numValidators === val
                      ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] border border-foreground shadow-none"
                      : "bg-background text-muted border border-border hover:border-foreground hover:text-foreground"
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

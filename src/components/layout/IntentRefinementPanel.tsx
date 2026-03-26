"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { getTemplate } from "@/engine/templateRegistry";
import { generateIntentDraft, type IntentDraftResult } from "@/lib/intentDraft";
import { useFlowStore } from "@/store/useFlowStore";

export default function IntentRefinementPanel() {
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const nodeData = useFlowStore((state) => state.nodeData);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const customCode = useFlowStore((state) => state.customCode);
  const draftSummary = useFlowStore((state) => state.draftSummary);
  const draftAssumptions = useFlowStore((state) => state.draftAssumptions);
  const lastIntentConfidence = useFlowStore((state) => state.lastIntentConfidence);
  const applyIntentDraft = useFlowStore((state) => state.applyIntentDraft);

  const [prompt, setPrompt] = useState("");
  const [pendingResult, setPendingResult] = useState<IntentDraftResult | null>(null);

  const snapshot = useMemo(
    () => ({
      activeTemplateId,
      nodeData,
      nodes,
      edges,
      customCode,
      editorMode: "visual" as const,
    }),
    [activeTemplateId, customCode, edges, nodeData, nodes]
  );

  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setPendingResult(
      generateIntentDraft({
        brief: trimmed,
        currentSnapshot: snapshot,
        mode: "refine",
      })
    );
  };

  const pendingTemplate = pendingResult
    ? getTemplate(pendingResult.templateRecommendation.templateId)
    : null;

  return (
    <div className="border border-border bg-background px-4 py-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 text-foreground" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted">
            Refine with AI
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Keep iterating in natural language
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Ask for changes like “use a URL source”, “make it moderation-focused”, or
            “turn this into governance”.
          </p>
        </div>
      </div>

      {draftSummary && (
        <div className="mt-3 border border-border bg-surface px-3 py-3">
          <p className="text-[10px] uppercase tracking-widest text-muted">Current draft</p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground">{draftSummary}</p>
          {lastIntentConfidence && (
            <p className="mt-2 text-[10px] text-muted">
              Last AI confidence: <span className="text-foreground">{lastIntentConfidence}</span>
            </p>
          )}
          {draftAssumptions.length > 0 && (
            <div className="mt-2 space-y-1 text-[10px] text-muted">
              {draftAssumptions.slice(0, 2).map((assumption) => (
                <p key={assumption}>{assumption}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Use a URL source instead of a pure AI flow."
        rows={4}
        data-testid="refine-request-input"
        className="mt-3 w-full resize-none border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
      />

      <button
        type="button"
        onClick={handleGenerate}
        data-testid="refine-request-generate"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
      >
        Generate refinement
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {pendingResult && (
        <div
          data-testid="refine-review-panel"
          className="mt-4 border border-border bg-surface px-3 py-3"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted">Proposed update</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {pendingTemplate?.name ?? "Updated draft"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {pendingResult.summary}
          </p>

          {pendingResult.patch.changedFields.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingResult.patch.changedFields.map((field) => (
                <span
                  key={field}
                  className="border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                >
                  {field === "templateId" ? "Contract type" : field}
                </span>
              ))}
            </div>
          )}

          {pendingResult.assumptions.length > 0 && (
            <div className="mt-3 space-y-1 text-[11px] text-muted">
              {pendingResult.assumptions.map((assumption) => (
                <p key={assumption.id}>{assumption.message}</p>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                applyIntentDraft(pendingResult, prompt.trim());
                setPendingResult(null);
                setPrompt("");
              }}
              data-testid="refine-apply-button"
              className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-2 text-xs font-medium text-background transition-all duration-150 hover:opacity-90"
            >
              Apply changes
            </button>
            <button
              type="button"
              onClick={() => setPendingResult(null)}
              className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2 text-xs text-foreground transition-all duration-150 hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

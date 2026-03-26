"use client";

import { useEffect, useMemo } from "react";
import { FlaskConical, Play, X } from "lucide-react";

import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { getPreviewScenario } from "@/lib/simulationPreview";
import { captureBuilderEvent } from "@/lib/telemetry";
import { useFlowStore } from "@/store/useFlowStore";

interface SimulationPreviewPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SimulationPreviewPanel({
  open,
  onClose,
}: SimulationPreviewPanelProps) {
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const nodeData = useFlowStore((state) => state.nodeData);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const customCode = useFlowStore((state) => state.customCode);
  const markPreviewReviewed = useFlowStore((state) => state.markPreviewReviewed);
  const dialogRef = useDialogFocusTrap({ open, onClose });
  const scenario = useMemo(
    () =>
      getPreviewScenario({
        activeTemplateId,
        nodeData,
        nodes,
        edges,
        generatedCode: customCode || undefined,
      }),
    [activeTemplateId, customCode, edges, nodeData, nodes]
  );

  useEffect(() => {
    if (!open) return;

    markPreviewReviewed();
    captureBuilderEvent("simulation_preview_opened", {
      templateId: activeTemplateId,
      nodeCount: nodes.length,
      inputCount: scenario.inputs.length,
    });
  }, [activeTemplateId, markPreviewReviewed, nodes.length, open, scenario.inputs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      data-testid="simulation-preview-panel"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-preview-title"
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden border border-border bg-surface outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-border bg-background">
              <FlaskConical className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 id="simulation-preview-title" className="text-lg font-bold">
                Behavior Preview
              </h2>
              <p className="text-[11px] text-muted">
                Review what people will provide, what outside information the contract uses, and what result it returns. This is a client-side preview, not live execution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close behavior preview"
            className="flex h-8 w-8 items-center justify-center rounded-none transition-all duration-150 hover:bg-surface-hover"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-y-auto border-r border-border bg-background/60">
            <div className="border-b border-border px-6 py-4">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                What People Provide
              </p>
              <p className="mt-1 text-xs text-foreground">{scenario.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                {scenario.description}
              </p>
            </div>

            <div className="space-y-3 px-6 py-4">
              {scenario.inputs.length === 0 ? (
                <div className="border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
                  No dynamic sample inputs are needed for the current flow. This graph is mostly configuration-driven.
                </div>
              ) : (
                scenario.inputs.map((input) => (
                  <label key={input.id} className="block">
                    <span className="block text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                      {input.label}
                    </span>
                    {input.type === "textarea" ? (
                      <textarea
                        key={`${input.id}-${input.sampleValue}`}
                        data-testid={`simulation-preview-input-${input.id}`}
                        defaultValue={input.sampleValue}
                        rows={4}
                        className="mt-1 w-full resize-none border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    ) : (
                      <input
                        key={`${input.id}-${input.sampleValue}`}
                        data-testid={`simulation-preview-input-${input.id}`}
                        type="text"
                        defaultValue={input.sampleValue}
                        className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}
                    <span className="mt-1 block text-[10px] text-muted">
                      {input.required ? "Required for this draft" : "Optional preview input"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="overflow-y-auto">
            <div className="border-b border-border px-6 py-4">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                What The Contract Does
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                The walkthrough below explains the contract behavior step by step. It helps you review the draft before export and does not validate runtime behavior.
              </p>
            </div>

            <div className="space-y-3 px-6 py-4">
              {scenario.steps.map((step) => (
                <div
                  key={step.id}
                  data-testid="simulation-preview-step"
                  className="border border-border bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-foreground" />
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-background/60 px-6 py-4">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                Contract Summary
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {scenario.result.summary}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="border border-border bg-surface px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Methods
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scenario.result.methods.map((method) => (
                      <span
                        key={method}
                        className="border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border border-border bg-surface px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Dependencies
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scenario.result.dependencies.map((dependency) => (
                      <span
                        key={dependency}
                        className="border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                      >
                        {dependency}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border border-border bg-surface px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Expected Inputs
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scenario.result.expectedInputs.length > 0 ? (
                      scenario.result.expectedInputs.map((input) => (
                        <span
                          key={input}
                          className="border border-border bg-background px-2 py-1 text-[11px] text-foreground"
                        >
                          {input}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted">No extra inputs</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

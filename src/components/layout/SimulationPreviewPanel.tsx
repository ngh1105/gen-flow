"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FlaskConical,
  Play,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";

import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import {
  getPreviewScenario,
  getScenarioCaseValues,
  simulatePreviewScenario,
} from "@/lib/simulationPreview";
import { captureBuilderEvent } from "@/lib/telemetry";
import { useFlowStore } from "@/store/useFlowStore";

interface SimulationPreviewPanelProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_META = {
  ready: {
    label: "Ready",
    badgeClass:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    cardClass: "border-emerald-500/30 bg-emerald-500/5",
  },
  review: {
    label: "Needs Review",
    badgeClass:
      "border-amber-500/40 bg-amber-500/10 text-amber-100",
    cardClass: "border-amber-500/30 bg-amber-500/5",
  },
  blocked: {
    label: "Blocked",
    badgeClass: "border-red-500/40 bg-red-500/10 text-red-200",
    cardClass: "border-red-500/30 bg-red-500/5",
  },
} as const;

const RISK_META = {
  low: "border-border bg-background text-muted",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  high: "border-red-500/30 bg-red-500/10 text-red-200",
} as const;

function getInputElementType(inputType: string): "text" | "url" {
  return inputType === "url" ? "url" : "text";
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
  const [activeCaseId, setActiveCaseId] = useState<string>("");
  const [caseOverrides, setCaseOverrides] = useState<
    Record<string, Record<string, string>>
  >({});
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
  const resolvedActiveCaseId = scenario.cases.some(
    (previewCase) => previewCase.id === activeCaseId
  )
    ? activeCaseId
    : scenario.cases[0]?.id ?? "";
  const caseValues = useMemo(
    () =>
      Object.fromEntries(
        scenario.cases.map((previewCase) => [
          previewCase.id,
          {
            ...getScenarioCaseValues(scenario, previewCase.id),
            ...(caseOverrides[previewCase.id] ?? {}),
          },
        ])
      ) as Record<string, Record<string, string>>,
    [caseOverrides, scenario]
  );
  const activeCase =
    scenario.cases.find(
      (previewCase) => previewCase.id === resolvedActiveCaseId
    ) ?? null;
  const activeValues =
    (activeCase && caseValues[activeCase.id]) ||
    (activeCase ? getScenarioCaseValues(scenario, activeCase.id) : {});
  const simulation =
    activeCase &&
    simulatePreviewScenario({
      scenario,
      caseId: activeCase.id,
      values: activeValues,
    });
  const stepOutcomeMap = useMemo(
    () =>
      new Map(
        simulation?.stepOutcomes.map((step) => [step.stepId, step]) ?? []
      ),
    [simulation]
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
        className="relative flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden border border-border bg-surface outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-border bg-background">
              <FlaskConical className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 id="simulation-preview-title" className="text-lg font-bold">
                Behavior Preview & Scenario Simulator
              </h2>
              <p className="text-[11px] text-muted">
                Review what people provide, then pressure-test the draft with
                happy-path, edge-case, and adversarial scenarios before export.
                This stays client-side and does not execute GenLayer code.
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

            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-foreground" />
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Scenario Simulator
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {scenario.cases.map((previewCase) => {
                  const selected = previewCase.id === activeCase?.id;

                  return (
                    <button
                      key={previewCase.id}
                      type="button"
                      data-testid={`simulation-preview-case-${previewCase.id}`}
                      onClick={() => setActiveCaseId(previewCase.id)}
                      className={`border px-3 py-2 text-left transition-all duration-150 ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <p className="text-[11px] font-medium">{previewCase.label}</p>
                      <p
                        className={`mt-1 max-w-56 text-[10px] leading-relaxed ${
                          selected ? "text-background/80" : "text-muted"
                        }`}
                      >
                        {previewCase.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {activeCase ? (
                <div className="mt-3 border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Current Focus
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground">
                    {activeCase.focus}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Scenario Inputs
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    Adjust the suggested values to see how the same draft reacts
                    to different evidence and payloads.
                  </p>
                </div>
                {activeCase ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCaseOverrides((current) => {
                        const next = { ...current };
                        delete next[activeCase.id];
                        return next;
                      })
                    }
                    className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[11px] text-muted transition-all duration-150 hover:bg-surface-hover hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Case
                  </button>
                ) : null}
              </div>

              {scenario.inputs.length === 0 ? (
                <div className="border border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted">
                  No dynamic sample inputs are needed for the current flow. Use
                  the simulator on the right to review structural risks and
                  expected behavior.
                </div>
              ) : (
                scenario.inputs.map((input) => (
                  <label key={input.id} className="block">
                    <span className="block text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                      {input.label}
                    </span>
                    {input.type === "textarea" ? (
                      <textarea
                        data-testid={`simulation-preview-input-${input.id}`}
                        value={activeValues[input.id] ?? ""}
                        onChange={(event) =>
                          activeCase &&
                          setCaseOverrides((current) => ({
                            ...current,
                            [activeCase.id]: {
                              ...(current[activeCase.id] ?? {}),
                              [input.id]: event.target.value,
                            },
                          }))
                        }
                        rows={4}
                        className="mt-1 w-full resize-none border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    ) : (
                      <input
                        data-testid={`simulation-preview-input-${input.id}`}
                        type={getInputElementType(input.type)}
                        value={activeValues[input.id] ?? ""}
                        onChange={(event) =>
                          activeCase &&
                          setCaseOverrides((current) => ({
                            ...current,
                            [activeCase.id]: {
                              ...(current[activeCase.id] ?? {}),
                              [input.id]: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}
                    <span className="mt-1 block text-[10px] text-muted">
                      {input.required
                        ? "Required for this draft"
                        : "Optional preview input"}
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
                The walkthrough below explains the contract behavior step by
                step and estimates how the current scenario should behave. Use
                this to review the draft before export, not as live execution.
              </p>
            </div>

            {simulation && activeCase ? (
              <div className="border-b border-border px-6 py-4">
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Simulated Outcome
                </p>
                <div
                  className={`mt-3 border px-4 py-4 ${
                    STATUS_META[simulation.status].cardClass
                  }`}
                  data-testid="simulation-preview-status"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`border px-2 py-1 text-[10px] font-display font-medium uppercase tracking-widest ${
                        STATUS_META[simulation.status].badgeClass
                      }`}
                    >
                      {STATUS_META[simulation.status].label}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted">
                      {activeCase.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {simulation.headline}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {simulation.summary}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="border border-border bg-background px-3 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted">
                        Key Findings
                      </p>
                      <div className="mt-2 space-y-2">
                        {simulation.findings.map((finding) => (
                          <div
                            key={finding}
                            className="flex items-start gap-2 text-[11px] leading-relaxed text-foreground"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-border bg-background px-3 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted">
                        Outcome Preview
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground">
                        {simulation.outputPreview}
                      </p>
                      <p className="mt-3 text-[10px] uppercase tracking-widest text-muted">
                        Suggested Next Action
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground">
                        {simulation.nextAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 px-6 py-4">
              {scenario.steps.map((step) => {
                const stepOutcome = stepOutcomeMap.get(step.id);
                const status = stepOutcome?.status ?? "ready";

                return (
                  <div
                    key={step.id}
                    data-testid="simulation-preview-step"
                    className={`border bg-background px-4 py-3 ${
                      status === "blocked"
                        ? "border-red-500/30"
                        : status === "review"
                          ? "border-amber-500/30"
                          : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Play className="h-3.5 w-3.5 text-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          {step.title}
                        </p>
                      </div>
                      <span
                        className={`border px-2 py-1 text-[10px] uppercase tracking-widest ${
                          STATUS_META[status].badgeClass
                        }`}
                      >
                        {STATUS_META[status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {step.description}
                    </p>
                    {stepOutcome ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-foreground">
                        {stepOutcome.note}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border bg-background/60 px-6 py-4">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                Contract Summary
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {scenario.result.summary}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                      <span className="text-[11px] text-muted">
                        No extra inputs
                      </span>
                    )}
                  </div>
                </div>
                <div className="border border-border bg-surface px-3 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted">
                    Structural Risks
                  </p>
                  <div className="mt-2 space-y-2">
                    {simulation?.activeRisks.length ? (
                      simulation.activeRisks.map((risk) => (
                        <div key={risk.id}>
                          <span
                            className={`inline-flex border px-2 py-1 text-[10px] uppercase tracking-widest ${
                              RISK_META[risk.severity]
                            }`}
                          >
                            {risk.severity}
                          </span>
                          <p className="mt-1 text-[11px] text-foreground">
                            {risk.label}
                          </p>
                          <p className="mt-1 text-[10px] leading-relaxed text-muted">
                            {risk.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted">
                        No structural risks detected in this preview.
                      </span>
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

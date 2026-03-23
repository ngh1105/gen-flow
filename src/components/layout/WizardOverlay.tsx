"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  Database,
  Globe,
  Puzzle,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

import ConfirmationDialog from "@/components/layout/ConfirmationDialog";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { getTemplate } from "@/engine/templateRegistry";
import { createEmptyNodeData } from "@/lib/contractPersistence";
import { getBuilderStatus } from "@/lib/exportRequirements";
import { addBuilderBreadcrumb } from "@/lib/telemetry";
import {
  getWizardRecommendation,
  type WizardAnswers,
} from "@/lib/wizardRecommendations";
import { useFlowStore } from "@/store/useFlowStore";

type WizardStep = "goal" | "data" | "consensus" | "result";

const GOALS = [
  {
    id: "store",
    label: "Store Data",
    desc: "Simple on-chain state and persistence",
    icon: Database,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "analyze",
    label: "Analyze Web Data",
    desc: "Review live evidence, oracle signals, or submissions",
    icon: Globe,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "ai",
    label: "AI Decision",
    desc: "AI-backed coordination, moderation, or rulings",
    icon: Brain,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "predict",
    label: "Predict Outcomes",
    desc: "Settle markets or benchmark live outcome sources",
    icon: Zap,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "custom",
    label: "Something Else",
    desc: "Compose your own flow from a blank canvas",
    icon: Puzzle,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
];

const DATA_SOURCES = [
  {
    id: "none",
    label: "No external data",
    desc: "Contract works with on-chain data only",
    icon: Database,
  },
  {
    id: "web",
    label: "Web / API",
    desc: "Fetch data from a URL or web page",
    icon: Globe,
  },
  {
    id: "user",
    label: "User Input",
    desc: "Users provide data when calling the contract",
    icon: User,
  },
  {
    id: "both",
    label: "Web + User Input",
    desc: "Combine web data with user-provided input",
    icon: Users,
  },
];

const CONSENSUS_TYPES = [
  {
    id: "strict",
    label: "Exact Match",
    desc: "All validators must return identical results",
    example: "Score: 2-1, Winner: Team A",
  },
  {
    id: "comparative",
    label: "Comparative",
    desc: "Key values must match (for example true or false)",
    example: "give_coin: false",
  },
  {
    id: "non_comparative",
    label: "Meaning-Based",
    desc: "Results should convey equivalent meaning",
    example: "Good analysis ~= Positive review",
  },
  {
    id: "none",
    label: "No Consensus Needed",
    desc: "Simple storage only, with no AI or web input",
    example: "Direct read/write operations",
  },
];

interface WizardOverlayProps {
  open: boolean;
  onClose: () => void;
}

function getPreviousStep(answers: WizardAnswers): WizardStep {
  if (answers.consensus && answers.consensus !== "none") return "consensus";
  if (answers.dataSource && answers.dataSource !== "none") return "data";
  return "goal";
}

export default function WizardOverlay({ open, onClose }: WizardOverlayProps) {
  const switchTemplate = useFlowStore((state) => state.switchTemplate);
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);
  const dialogRef = useDialogFocusTrap({ open, onClose });
  const [step, setStep] = useState<WizardStep>("goal");
  const [answers, setAnswers] = useState<WizardAnswers>({
    goal: "",
    dataSource: "",
    consensus: "",
  });
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const closeAndReset = useCallback(() => {
    setStep("goal");
    setAnswers({ goal: "", dataSource: "", consensus: "" });
    setPendingTemplateId(null);
    onClose();
  }, [onClose]);

  const executeFinish = (templateId: string) => {
    addBuilderBreadcrumb("wizard_template_applied", {
      templateId,
      hadUnsavedChanges: hasUnsavedChanges,
    });
    switchTemplate(templateId);
    closeAndReset();
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAndReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAndReset, open]);

  const handleFinishRequest = (overrideId?: string) => {
    const templateId = overrideId || getWizardRecommendation(answers).templateId;
    if (hasUnsavedChanges) {
      setPendingTemplateId(templateId);
      return;
    }
    executeFinish(templateId);
  };

  if (!open) return null;

  const steps: WizardStep[] = ["goal", "data", "consensus", "result"];
  const currentIndex = steps.indexOf(step);
  const recommendation = getWizardRecommendation(answers);
  const recommendedTemplate = getTemplate(recommendation.templateId);
  const alternativeTemplate = recommendation.alternativeTemplateId
    ? getTemplate(recommendation.alternativeTemplateId)
    : undefined;
  const previewStatus = recommendedTemplate
    ? getBuilderStatus(createEmptyNodeData(), recommendedTemplate.defaultNodes, {
        activeTemplateId: recommendedTemplate.id,
        edges: recommendedTemplate.defaultEdges,
      })
    : getBuilderStatus(createEmptyNodeData(), [], {
        activeTemplateId: "custom-compose",
      });

  const canProceed = () => {
    if (step === "goal") return answers.goal !== "";
    if (step === "data") return answers.dataSource !== "";
    if (step === "consensus") return answers.consensus !== "";
    return true;
  };

  const handleNext = () => {
    if (step === "goal" && (answers.goal === "store" || answers.goal === "custom")) {
      setAnswers((current) => ({
        ...current,
        dataSource: "none",
        consensus: "none",
      }));
      setStep("result");
      return;
    }

    if (step === "goal") {
      setStep("data");
      return;
    }

    if (step === "data") {
      if (answers.dataSource === "none") {
        setAnswers((current) => ({ ...current, consensus: "none" }));
        setStep("result");
        return;
      }

      setStep("consensus");
      return;
    }

    if (step === "consensus") {
      setStep("result");
    }
  };

  const handleBack = () => {
    if (step === "data") setStep("goal");
    if (step === "consensus") setStep("data");
    if (step === "result") setStep(getPreviousStep(answers));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      data-testid="wizard-overlay"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAndReset}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        aria-describedby="wizard-description"
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-none border border-border bg-surface shadow-none outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-foreground" />
            <div>
              <h2 id="wizard-title" className="text-lg font-bold">
                Smart Wizard
              </h2>
              <p id="wizard-description" className="text-[11px] text-muted">
                Preview the recommended template before it replaces your current canvas.
              </p>
            </div>
          </div>
          <button
            onClick={closeAndReset}
            aria-label="Close Smart Wizard"
            className="flex h-8 w-8 items-center justify-center rounded-none transition-all duration-150 hover:bg-surface-hover"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-1">
            {steps.map((item, index) => (
              <div
                key={item}
                className={`h-1 flex-1 rounded-none transition-all duration-150 ${
                  index <= currentIndex ? "bg-foreground" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Step {currentIndex + 1} of {steps.length}
          </p>
        </div>

        <div className="min-h-[320px] px-6 py-5">
          {step === "goal" && (
            <>
              <h3 className="mb-1 text-base font-display font-medium">
                What do you want your contract to do?
              </h3>
              <p className="mb-4 text-xs text-muted">
                Choose the main job. The wizard only applies a template after you confirm.
              </p>
              <div className="space-y-2">
                {GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const selected = answers.goal === goal.id;

                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setAnswers((current) => ({ ...current, goal: goal.id }))}
                      data-testid={`wizard-goal-${goal.id}`}
                      className={`w-full rounded-none border px-4 py-3 text-left transition-all duration-150 ${
                        selected
                          ? `${goal.bg} border ${goal.border}`
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${selected ? goal.color : "text-muted"}`} />
                        <div>
                          <p className={`text-sm font-medium ${selected ? goal.color : ""}`}>
                            {goal.label}
                          </p>
                          <p className="text-[11px] text-muted">{goal.desc}</p>
                        </div>
                        {selected && (
                          <CheckCircle2 className={`ml-auto h-4 w-4 shrink-0 ${goal.color}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "data" && (
            <>
              <h3 className="mb-1 text-base font-display font-medium">
                Where does the data come from?
              </h3>
              <p className="mb-4 text-xs text-muted">
                This helps GenFlow choose whether your template needs URLs, user input, or both.
              </p>
              <div className="space-y-2">
                {DATA_SOURCES.map((source) => {
                  const Icon = source.icon;
                  const selected = answers.dataSource === source.id;

                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() =>
                        setAnswers((current) => ({ ...current, dataSource: source.id }))
                      }
                      data-testid={`wizard-data-${source.id}`}
                      className={`w-full rounded-none border px-4 py-3 text-left transition-all duration-150 ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-background" : "text-muted"}`} />
                        <div>
                          <p className={`text-sm font-medium ${selected ? "text-background" : ""}`}>
                            {source.label}
                          </p>
                          <p className={`text-[11px] ${selected ? "text-background/70" : "text-muted"}`}>
                            {source.desc}
                          </p>
                        </div>
                        {selected && (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-background" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "consensus" && (
            <>
              <h3 className="mb-1 text-base font-display font-medium">
                How should validators agree?
              </h3>
              <p className="mb-4 text-xs text-muted">
                Choose the consensus style for non-deterministic results.
              </p>
              <div className="space-y-2">
                {CONSENSUS_TYPES.map((consensus) => {
                  const selected = answers.consensus === consensus.id;

                  return (
                    <button
                      key={consensus.id}
                      type="button"
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          consensus: consensus.id,
                        }))
                      }
                      data-testid={`wizard-consensus-${consensus.id}`}
                      className={`w-full rounded-none border px-4 py-3 text-left transition-all duration-150 ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${selected ? "text-background" : ""}`}>
                          {consensus.label}
                        </p>
                        {selected && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-background" />
                        )}
                      </div>
                      <p className={`mt-0.5 text-[11px] ${selected ? "text-background/70" : "text-muted"}`}>
                        {consensus.desc}
                      </p>
                      <p className={`mt-1 text-[10px] italic font-mono ${selected ? "text-background/50" : "text-muted/60"}`}>
                        e.g. {consensus.example}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "result" && (
            <>
              <h3 className="mb-1 text-base font-display font-medium">
                Here&apos;s your recommended starting point
              </h3>
              <p className="mb-4 text-xs text-muted">
                Review the template profile first. Your current canvas stays untouched until you apply it.
              </p>

              <div className="border border-foreground bg-foreground p-5 text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-none bg-background text-foreground">
                  <Sparkles className="h-7 w-7" />
                </div>
                <p className="mb-1 text-lg font-bold text-background">
                  <span data-testid="wizard-recommendation-name">
                    {recommendedTemplate?.name ?? "Custom Compose"}
                  </span>
                </p>
                <p className="mx-auto max-w-sm text-xs text-background/80">
                  {recommendedTemplate?.description ??
                    "Start from an open canvas and compose the contract flow block by block."}
                </p>
                <div className="mt-3 inline-flex border border-background/20 bg-background/10 px-2 py-1 text-[10px] uppercase tracking-widest text-background">
                  Confidence: {recommendation.confidence}
                </div>
              </div>

              <div className="mt-4 border border-border bg-surface-hover p-3">
                <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Why this matches
                </p>
                <p className="text-xs leading-relaxed text-foreground">
                  {recommendation.reason}
                </p>
              </div>

              {recommendation.caution && (
                <div className="mt-4 border border-border bg-background p-3">
                  <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Why not fully certain
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {recommendation.caution}
                  </p>
                </div>
              )}

              {recommendedTemplate && (
                <div className="mt-4 border border-border bg-surface-hover p-3">
                  <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Template profile
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground">
                      {recommendedTemplate.category}
                    </span>
                    {recommendedTemplate.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alternativeTemplate && recommendation.alternativeReason && (
                <div className="mt-4 border border-border bg-surface-hover p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                        Stronger alternative
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {alternativeTemplate.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {recommendation.alternativeReason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFinishRequest(alternativeTemplate.id)}
                      data-testid="wizard-apply-alternative"
                      className="shrink-0 border border-border bg-background px-3 py-1.5 text-[11px] font-medium text-foreground transition-all duration-150 hover:bg-surface"
                    >
                      Apply Alternative
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 border border-border bg-surface-hover p-3">
                <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Export requirements
                </p>
                <p className="mb-2 text-xs text-muted">
                  The same checklist used in the builder will ask for these items first:
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewStatus.requirements
                    .filter((requirement) => requirement.required)
                    .map((requirement) => (
                      <span
                        key={requirement.id}
                        className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground"
                      >
                        {requirement.label}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-4 border border-border bg-surface-hover p-3">
                <p className="mb-2 text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Your choices
                </p>
                <div className="flex flex-wrap gap-2">
                  {answers.goal && (
                    <span className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground">
                      {GOALS.find((goal) => goal.id === answers.goal)?.label}
                    </span>
                  )}
                  {answers.dataSource && answers.dataSource !== "none" && (
                    <span className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground">
                      {DATA_SOURCES.find((source) => source.id === answers.dataSource)?.label}
                    </span>
                  )}
                  {answers.consensus && answers.consensus !== "none" && (
                    <span className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground">
                      {CONSENSUS_TYPES.find((consensus) => consensus.id === answers.consensus)?.label}
                    </span>
                  )}
                </div>
              </div>

              {hasUnsavedChanges && (
                <div className="mt-4 border border-border bg-background px-3 py-2 text-xs text-muted">
                  Applying this template replaces the current canvas view. Your in-progress draft
                  is autosaved separately and can still be recovered in this browser.
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={currentIndex > 0 ? handleBack : closeAndReset}
            className="flex items-center gap-1.5 rounded-none px-4 py-2 text-sm text-muted transition-all duration-150 hover:bg-surface-hover hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {currentIndex > 0 ? "Back" : "Cancel"}
          </button>

          {step === "result" ? (
            <button
              onClick={() => handleFinishRequest()}
              data-testid="wizard-start-building"
              className="flex items-center gap-1.5 rounded-none bg-foreground px-5 py-2.5 text-sm font-display font-medium text-background transition-all duration-150 hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Apply Template
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              data-testid="wizard-next-button"
              className={`flex items-center gap-1.5 rounded-none px-5 py-2.5 text-sm font-display font-medium transition-all duration-150 ${
                canProceed()
                  ? "border border-foreground bg-foreground text-background hover:bg-foreground hover:opacity-90"
                  : "cursor-not-allowed bg-border text-muted"
              }`}
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={pendingTemplateId !== null}
        title="Replace current draft?"
        description="Applying this wizard result replaces the current canvas layout. Your latest draft is autosaved in this browser, but the current view will switch immediately."
        confirmLabel="Apply Template"
        onClose={() => setPendingTemplateId(null)}
        onConfirm={() => {
          if (!pendingTemplateId) return;
          executeFinish(pendingTemplateId);
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Globe,
  Brain,
  Database,
  Zap,
  Users,
  User,
  CheckCircle2,
  Sparkles,
  Puzzle,
} from "lucide-react";
import { useFlowStore } from "@/store/useFlowStore";

type WizardStep = "goal" | "data" | "consensus" | "result";

interface WizardAnswers {
  goal: string;
  dataSource: string;
  consensus: string;
}

const GOALS = [
  {
    id: "store",
    label: "Store Data",
    desc: "Simple on-chain key-value storage",
    icon: Database,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "analyze",
    label: "Analyze Web Data",
    desc: "Fetch a URL and process the result",
    icon: Globe,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "ai",
    label: "AI Decision",
    desc: "Use AI to evaluate, judge, or decide",
    icon: Brain,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "predict",
    label: "Predict Outcomes",
    desc: "Resolve predictions using real-world data",
    icon: Zap,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
  },
  {
    id: "custom",
    label: "Something Else",
    desc: "I'll compose my own from scratch",
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
    desc: "Key values must match (e.g. true/false, win/lose)",
    example: 'give_coin: false → all agree on "false"',
  },
  {
    id: "non_comparative",
    label: "Meaning-Based",
    desc: "Results should convey equivalent meaning",
    example: '"Good analysis" ≈ "Positive review"',
  },
  {
    id: "none",
    label: "No Consensus Needed",
    desc: "Simple storage — no AI or web involved",
    example: "Direct read/write operations",
  },
];

function resolveTemplate(answers: WizardAnswers): string {
  const { goal, dataSource, consensus } = answers;

  // Custom compose
  if (goal === "custom") return "custom-compose";

  // Simple storage
  if (goal === "store" && (dataSource === "none" || dataSource === "user")) {
    return "simple-storage";
  }

  // Prediction market
  if (goal === "predict" && (dataSource === "web" || dataSource === "both")) {
    return "prediction-market";
  }

  // AI game
  if (goal === "ai" && dataSource === "user" && consensus === "comparative") {
    return "ai-game";
  }

  // Content filter
  if (goal === "ai" && dataSource === "user") {
    return "content-filter";
  }

  // DAO vote
  if (goal === "ai" && consensus === "non_comparative") {
    return "dao-vote";
  }

  // Price oracle
  if (goal === "analyze" && consensus === "comparative") {
    return "price-oracle";
  }

  // AI Arbitrator (default for web + AI combos)
  if (
    (goal === "analyze" || goal === "predict") &&
    (dataSource === "web" || dataSource === "both")
  ) {
    return "ai-arbitrator";
  }

  // Broad AI usage
  if (goal === "ai") return "ai-arbitrator";

  // Fallback
  return "custom-compose";
}

interface WizardOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function WizardOverlay({ open, onClose }: WizardOverlayProps) {
  const switchTemplate = useFlowStore((s) => s.switchTemplate);
  const [step, setStep] = useState<WizardStep>("goal");
  const [answers, setAnswers] = useState<WizardAnswers>({
    goal: "",
    dataSource: "",
    consensus: "",
  });

  if (!open) return null;

  const steps: WizardStep[] = ["goal", "data", "consensus", "result"];
  const currentIndex = steps.indexOf(step);

  const canProceed = () => {
    if (step === "goal") return answers.goal !== "";
    if (step === "data") return answers.dataSource !== "";
    if (step === "consensus") return answers.consensus !== "";
    return true;
  };

  const handleNext = () => {
    if (step === "goal" && (answers.goal === "store" || answers.goal === "custom")) {
      // Skip data + consensus for storage
      if (answers.goal === "custom") {
        handleFinish("custom-compose");
        return;
      }
      setAnswers((a) => ({ ...a, dataSource: "none", consensus: "none" }));
      handleFinish("simple-storage");
      return;
    }
    if (step === "goal") { setStep("data"); return; }
    if (step === "data") {
      if (answers.dataSource === "none") {
        setAnswers((a) => ({ ...a, consensus: "none" }));
        setStep("result");
        return;
      }
      setStep("consensus");
      return;
    }
    if (step === "consensus") { setStep("result"); return; }
  };

  const handleBack = () => {
    if (step === "data") setStep("goal");
    if (step === "consensus") setStep("data");
    if (step === "result") setStep("consensus");
  };

  const handleFinish = (overrideId?: string) => {
    const templateId = overrideId || resolveTemplate(answers);
    switchTemplate(templateId);
    onClose();
    // Reset wizard
    setStep("goal");
    setAnswers({ goal: "", dataSource: "", consensus: "" });
  };

  const resolvedTemplate = resolveTemplate(answers);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-none border border-border bg-surface shadow-none shadow-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-bold">Smart Wizard</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-none hover:bg-surface-hover transition-all duration-150"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-none transition-all duration-150 ${
                  i <= currentIndex
                    ? "bg-foreground"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            Step {currentIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[300px]">
          {step === "goal" && (
            <>
              <h3 className="text-base font-display font-medium mb-1">
                What do you want your contract to do?
              </h3>
              <p className="text-xs text-muted mb-4">
                Pick the main purpose of your Intelligent Contract.
              </p>
              <div className="space-y-2">
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const selected = answers.goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setAnswers((a) => ({ ...a, goal: g.id }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-none border transition-all duration-150 text-left ${
                        selected
                          ? `${g.bg} ${g.border} border`
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${selected ? g.color : "text-muted"}`} />
                      <div>
                        <p className={`text-sm font-medium ${selected ? g.color : ""}`}>
                          {g.label}
                        </p>
                        <p className="text-[11px] text-muted">{g.desc}</p>
                      </div>
                      {selected && (
                        <CheckCircle2 className={`w-4 h-4 ml-auto shrink-0 ${g.color}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "data" && (
            <>
              <h3 className="text-base font-display font-medium mb-1">
                Where does the data come from?
              </h3>
              <p className="text-xs text-muted mb-4">
                Choose how your contract gets its input data.
              </p>
              <div className="space-y-2">
                {DATA_SOURCES.map((d) => {
                  const Icon = d.icon;
                  const selected = answers.dataSource === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setAnswers((a) => ({ ...a, dataSource: d.id }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-none border transition-all duration-150 text-left ${
                        selected
                          ? "bg-foreground border-foreground"
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${selected ? "text-foreground" : "text-muted"}`} />
                      <div>
                        <p className={`text-sm font-medium ${selected ? "text-foreground" : ""}`}>
                          {d.label}
                        </p>
                        <p className="text-[11px] text-muted">{d.desc}</p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "consensus" && (
            <>
              <h3 className="text-base font-display font-medium mb-1">
                How should validators agree?
              </h3>
              <p className="text-xs text-muted mb-4">
                Choose the consensus mechanism for non-deterministic results.
              </p>
              <div className="space-y-2">
                {CONSENSUS_TYPES.map((c) => {
                  const selected = answers.consensus === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setAnswers((a) => ({ ...a, consensus: c.id }))}
                      className={`w-full px-4 py-3 rounded-none border transition-all duration-150 text-left ${
                        selected
                          ? "bg-foreground border-foreground"
                          : "border-border hover:border-foreground hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${selected ? "text-foreground" : ""}`}>
                          {c.label}
                        </p>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-foreground" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">{c.desc}</p>
                      <p className="text-[10px] text-muted/60 mt-1 font-mono italic">
                        e.g. {c.example}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === "result" && (
            <>
              <h3 className="text-base font-display font-medium mb-1">
                Perfect! Here&apos;s your match
              </h3>
              <p className="text-xs text-muted mb-5">
                Based on your answers, we recommend this template:
              </p>

              <div className="p-5 rounded-none border border-foreground bg-foreground text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-foreground mb-3">
                  <Sparkles className="w-7 h-7 text-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground mb-1">
                  {resolvedTemplate.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-muted">
                  Template will be loaded with default nodes and generated code.
                </p>
              </div>

              <div className="mt-4 p-3 rounded-none bg-surface-hover border border-border">
                <p className="text-[10px] text-muted uppercase tracking-widest font-display font-medium mb-2">
                  Your choices
                </p>
                <div className="flex flex-wrap gap-2">
                  {answers.goal && (
                    <span className="text-[11px] px-2 py-1 rounded-none bg-surface text-foreground border border-border">
                      {GOALS.find((g) => g.id === answers.goal)?.label}
                    </span>
                  )}
                  {answers.dataSource && answers.dataSource !== "none" && (
                    <span className="text-[11px] px-2 py-1 rounded-none bg-surface text-foreground border border-border">
                      {DATA_SOURCES.find((d) => d.id === answers.dataSource)?.label}
                    </span>
                  )}
                  {answers.consensus && answers.consensus !== "none" && (
                    <span className="text-[11px] px-2 py-1 rounded-none bg-surface text-foreground border border-border">
                      {CONSENSUS_TYPES.find((c) => c.id === answers.consensus)?.label}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={currentIndex > 0 ? handleBack : onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-none text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {currentIndex > 0 ? "Back" : "Cancel"}
          </button>

          {step === "result" ? (
            <button
              onClick={() => handleFinish()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-none bg-foreground text-background text-sm font-display font-medium hover:opacity-90 transition-all duration-150"
            >
              <Sparkles className="w-4 h-4" />
              Start Building
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-none text-sm font-display font-medium transition-all duration-150 ${
                canProceed()
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground"
                  : "bg-border text-muted cursor-not-allowed"
              }`}
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

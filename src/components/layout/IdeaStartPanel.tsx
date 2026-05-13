"use client";

import { useMemo, useState } from "react";
import { ArrowRight, MessageSquareText, Sparkles } from "lucide-react";

import { getTemplate } from "@/engine/templateRegistry";
import { generateIntentDraft, getStarterPrompts, type IntentDraftResult } from "@/lib/intentDraft";
import { useFlowStore } from "@/store/useFlowStore";

interface IdeaStartPanelProps {
  onOpenWizard: () => void;
}

function FieldSuggestionList({ result }: { result: IntentDraftResult }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {result.fieldSuggestions.map((field) => (
        <div key={field.id} className="border border-border bg-background px-3 py-3">
          <p className="text-[10px] uppercase tracking-widest text-muted">{field.label}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{String(field.value)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{field.reason}</p>
        </div>
      ))}
    </div>
  );
}

export default function IdeaStartPanel({ onOpenWizard }: IdeaStartPanelProps) {
  const applyIntentDraft = useFlowStore((state) => state.applyIntentDraft);
  const [brief, setBrief] = useState("");
  const [pendingResult, setPendingResult] = useState<IntentDraftResult | null>(null);

  const starterPrompts = useMemo(() => getStarterPrompts(), []);

  const handleGenerate = () => {
    const trimmed = brief.trim();
    if (!trimmed) return;

    setPendingResult(generateIntentDraft({ brief: trimmed, mode: "create" }));
  };

  const pendingTemplate = pendingResult
    ? getTemplate(pendingResult.templateRecommendation.templateId)
    : null;
  const alternativeTemplate = pendingResult?.templateRecommendation.alternativeTemplateId
    ? getTemplate(pendingResult.templateRecommendation.alternativeTemplateId)
    : null;

  return (
    <section
      data-testid="chat-first-shell"
      className="flex flex-1 overflow-y-auto bg-transparent"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="relative overflow-hidden rounded-[28px] border border-accent-blue/30 bg-surface-elevated px-7 py-7 text-foreground shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-widest text-accent-blue">
              Start with an idea
            </p>
          </div>
          <h2 className="mt-2 text-3xl font-display font-medium">
            Describe the contract you want to build
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Write a short brief in natural language. GenFlow will choose a contract type,
            prefill the draft, and then guide you through review, preview, and export.
          </p>

          <label className="mt-5 block">
            <span className="sr-only">Describe your contract idea</span>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="I need a contract that fetches a price feed every time a user calls it and stores the latest result."
              rows={6}
              data-testid="idea-brief-input"
              className="w-full resize-none rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none transition-all duration-150 focus:border-accent-blue/70 focus:ring-4 focus:ring-accent-blue/10"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {starterPrompts.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                data-testid={`idea-starter-${index}`}
                onClick={() => setBrief(prompt)}
                className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-muted transition-all duration-150 hover:border-accent-blue/50 hover:text-accent-blue"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              data-testid="idea-generate-button"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-accent-blue/40 bg-accent-blue px-4 py-2 text-sm font-semibold text-background transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent-blue/90"
            >
              Generate my contract draft
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenWizard}
              data-testid="idea-open-wizard"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-background/70 px-4 py-2 text-sm text-muted transition-all duration-150 hover:border-accent-purple/50 hover:text-accent-purple"
            >
              <MessageSquareText className="h-4 w-4" />
              More ways to start
            </button>
          </div>
        </div>

        {pendingResult && (
          <div
            data-testid="idea-draft-review"
            className="rounded-[24px] border border-border bg-surface/80 px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted">Draft review</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-display font-medium text-foreground">
                {pendingTemplate?.name ?? "Recommended draft"}
              </h3>
              <span className="rounded-full border border-accent-green/30 bg-accent-green/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-accent-green">
                {pendingResult.templateRecommendation.confidence} confidence
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{pendingResult.summary}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {pendingResult.templateRecommendation.reason}
            </p>

            {pendingResult.assumptions.length > 0 && (
              <div className="mt-4 border border-border bg-surface px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  What I assumed
                </p>
                <div className="mt-2 space-y-1 text-[11px] text-muted">
                  {pendingResult.assumptions.map((assumption) => (
                    <p key={assumption.id}>{assumption.message}</p>
                  ))}
                </div>
              </div>
            )}

            {alternativeTemplate && pendingResult.templateRecommendation.alternativeReason && (
              <div className="mt-4 border border-border bg-surface px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-muted">
                  Alternative
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {alternativeTemplate.name}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {pendingResult.templateRecommendation.alternativeReason}
                </p>
              </div>
            )}

            <FieldSuggestionList result={pendingResult} />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyIntentDraft(pendingResult, brief.trim())}
                data-testid="idea-accept-draft"
                className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background transition-all duration-150 hover:opacity-90"
              >
                Accept draft
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPendingResult(null)}
                className="inline-flex items-center gap-1.5 border border-border bg-surface px-4 py-2 text-sm text-foreground transition-all duration-150 hover:bg-surface-hover"
              >
                Refine request
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
